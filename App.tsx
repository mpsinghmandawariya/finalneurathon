
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Receipt, 
  Users, 
  Package, 
  Bell, 
  Mic, 
  MicOff, 
  Send, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock,
  Smartphone,
  ChevronRight,
  Search
} from 'lucide-react';
import { 
  Product, 
  Invoice, 
  Customer, 
  Reminder, 
  AppView, 
  InvoiceItem,
  AIResponse
} from './types';
import { INITIAL_PRODUCTS, GST_RATES } from './constants';
import { processMessage } from './services/geminiService';

// Fallback Speech Recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'agent', text: string, data?: any}[]>([
    { role: 'agent', text: 'Namaste! I am Bharat Biz-Agent. How can I help your business today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [draftInvoice, setDraftInvoice] = useState<Invoice | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Voice Recognition Setup
  const toggleListening = () => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Default to Hindi-India, handles Hinglish well
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
      };
      recognition.start();
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setUserInput('');

    try {
      const aiResponse: AIResponse = await processMessage(text);
      
      setChatMessages(prev => [...prev, { 
        role: 'agent', 
        text: aiResponse.message, 
        data: aiResponse.extractedData 
      }]);

      if (voiceEnabled) speak(aiResponse.message);

      // Handle specific intents
      if (aiResponse.intent === 'billing' && aiResponse.extractedData) {
        generateDraftInvoice(aiResponse.extractedData);
      } else if (aiResponse.intent === 'reminder' && aiResponse.extractedData) {
        const newReminder: Reminder = {
          id: Date.now().toString(),
          text: aiResponse.extractedData.text || text,
          dueDate: aiResponse.extractedData.date || new Date().toLocaleDateString(),
          status: 'Pending'
        };
        setReminders(prev => [...prev, newReminder]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'agent', text: "Sorry, I encountered an error. Please try again." }]);
    }
  };

  const generateDraftInvoice = (itemsData: any[]) => {
    const invoiceItems: InvoiceItem[] = itemsData.map((item: any) => {
      const matchedProduct = products.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()));
      const category = matchedProduct?.category || 'general_goods';
      const rate = matchedProduct?.price || item.price || 0;
      const gstRate = GST_RATES[category];
      const qty = parseFloat(item.quantity) || 1;
      const subtotal = qty * rate;
      
      return {
        productId: matchedProduct?.id || 'manual',
        name: item.name,
        quantity: qty,
        unit: item.unit || matchedProduct?.unit || 'unit',
        pricePerUnit: rate,
        gstRate: gstRate,
        total: subtotal + (subtotal * gstRate)
      };
    });

    const subTotal = invoiceItems.reduce((acc, item) => acc + (item.pricePerUnit * item.quantity), 0);
    const gstTotal = invoiceItems.reduce((acc, item) => acc + (item.pricePerUnit * item.quantity * item.gstRate), 0);
    
    const newInvoice: Invoice = {
      id: `INV${Date.now()}`,
      items: invoiceItems,
      subTotal,
      gstTotal,
      grandTotal: subTotal + gstTotal,
      date: new Date().toISOString(),
      paymentStatus: 'Pending'
    };

    setDraftInvoice(newInvoice);
  };

  const finalizeInvoice = () => {
    if (draftInvoice) {
      setInvoices(prev => [draftInvoice, ...prev]);
      setDraftInvoice(null);
      setChatMessages(prev => [...prev, { role: 'agent', text: `Invoice ${draftInvoice.id} has been created successfully!` }]);
      speak("Invoice create ho gayi hai.");
    }
  };

  // Dashboard Stats
  const todaySales = invoices
    .filter(inv => new Date(inv.date).toDateString() === new Date().toDateString())
    .reduce((acc, inv) => acc + inv.grandTotal, 0);
  
  const pendingPayments = invoices
    .filter(inv => inv.paymentStatus === 'Pending')
    .reduce((acc, inv) => acc + inv.grandTotal, 0);

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Business Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Today's Sales</span>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Receipt size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{todaySales.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">↑ 12% from yesterday</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Pending Payments</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{pendingPayments.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">{invoices.filter(i => i.paymentStatus === 'Pending').length} invoices</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Customers</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
          <div className="text-xs text-blue-600 mt-1">3 new this week</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Active Reminders</span>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Bell size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{reminders.filter(r => r.status === 'Pending').length}</div>
          <div className="text-xs text-purple-600 mt-1">Next: Call Supplier</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
          <div className="space-y-3">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{inv.id}</div>
                  <div className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{inv.grandTotal.toFixed(2)}</div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${inv.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inv.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <div className="text-center py-8 text-gray-400">No invoices yet. Use the Chat to create one!</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {reminders.filter(r => r.status === 'Pending').map(rem => (
              <div key={rem.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{rem.text}</div>
                  <div className="text-[10px] text-gray-500">Due: {rem.dueDate}</div>
                </div>
                <button 
                  onClick={() => setReminders(reminders.map(r => r.id === rem.id ? {...r, status: 'Completed'} : r))}
                  className="p-1 text-gray-400 hover:text-green-500"
                >
                  <CheckCircle2 size={18} />
                </button>
              </div>
            ))}
            {reminders.filter(r => r.status === 'Pending').length === 0 && <div className="text-center py-8 text-gray-400">All caught up!</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {draftInvoice && (
          <div className="flex justify-start">
            <div className="max-w-[90%] bg-white p-4 rounded-2xl shadow-md border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Receipt size={18} /> Draft Invoice
              </h3>
              <div className="space-y-2 mb-4">
                {draftInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs border-b border-gray-100 pb-1">
                    <span>{item.name} ({item.quantity} {item.unit})</span>
                    <span className="font-medium">₹{item.total.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-sm pt-2">
                  <span>Grand Total</span>
                  <span>₹{draftInvoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={finalizeInvoice}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Confirm Bill
                </button>
                <button 
                  onClick={() => setDraftInvoice(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-full transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <input 
            type="text" 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
            placeholder="Type items (e.g., 2kg rice 120)..."
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-full outline-none focus:border-blue-500 transition-colors"
          />
          
          <button 
            onClick={() => handleSendMessage(userInput)}
            disabled={!userInput.trim()}
            className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-gray-400"
          >
            <Send size={24} />
          </button>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
              voiceEnabled ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-400'
            }`}
          >
            Speech Output: {voiceEnabled ? 'ON' : 'OFF'}
          </button>
          <div className="text-[10px] text-gray-400">Supports Hindi, English & Hinglish</div>
        </div>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices & Bills</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={18} /> New Bill
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Invoice ID</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{inv.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.date).toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-gray-900">₹{inv.grandTotal.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                    inv.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {inv.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No invoices found. Use the Agent to create your first bill!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Directory</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                {c.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{c.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Smartphone size={12} /> {c.mobile}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center border-t border-gray-50 pt-3">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Total Spent</div>
                <div className="font-bold text-gray-900">₹{c.totalSpent.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Visits</div>
                <div className="font-bold text-gray-900">{c.visitCount}</div>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
            Register your first customer by mentioning them in a bill!
          </div>
        )}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Catalog</h1>
        <div className="flex gap-2">
           <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">Categories</button>
           <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add Product</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{p.category.replace('_', ' ')}</div>
            <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
            <div className="flex items-end justify-between">
              <div className="text-xl font-black text-gray-900">₹{p.price}<span className="text-xs font-normal text-gray-400">/{p.unit}</span></div>
              <div className="text-[10px] text-gray-400">GST: {GST_RATES[p.category] * 100}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'chat': return renderChat();
      case 'invoices': return renderInvoices();
      case 'customers': return renderCustomers();
      case 'products': return renderProducts();
      case 'reminders': return renderDashboard(); // Grouped in dashboard for now
      default: return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-full">
        <div className="p-6">
          <div className="text-xl font-black tracking-tighter text-blue-400 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">B</div>
            BHARAT BIZ
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <NavItem active={activeView === 'chat'} onClick={() => setActiveView('chat')} icon={<MessageSquare size={20}/>} label="AI Biz-Agent" />
          <NavItem active={activeView === 'invoices'} onClick={() => setActiveView('invoices')} icon={<Receipt size={20}/>} label="Invoices" />
          <NavItem active={activeView === 'customers'} onClick={() => setActiveView('customers')} icon={<Users size={20}/>} label="Customers" />
          <NavItem active={activeView === 'products'} onClick={() => setActiveView('products')} icon={<Package size={20}/>} label="Products" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">S</div>
            <div>
              <div className="text-xs font-bold">Shop Owner</div>
              <div className="text-[10px] text-slate-500">Premium Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
           <div className="font-black text-blue-600 text-lg">BHARAT BIZ</div>
           <button className="p-2 text-gray-500"><Bell size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around p-2 bg-white border-t border-gray-200 shadow-lg">
          <MobileNavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={24}/>} label="Home" />
          <MobileNavItem active={activeView === 'chat'} onClick={() => setActiveView('chat')} icon={<MessageSquare size={24}/>} label="AI Agent" />
          <MobileNavItem active={activeView === 'invoices'} onClick={() => setActiveView('invoices')} icon={<Receipt size={24}/>} label="Bills" />
          <MobileNavItem active={activeView === 'customers'} onClick={() => setActiveView('customers')} icon={<Users size={24}/>} label="Users" />
        </nav>
      </main>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

const MobileNavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 transition-all ${
      active ? 'text-blue-600' : 'text-gray-400'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
