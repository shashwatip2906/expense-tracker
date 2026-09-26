import { useEffect, useMemo, useState, type CSSProperties, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Film,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrainFront,
  Utensils,
  WalletCards,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';

type Category = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Health' | 'Entertainment' | 'Other';
type Expense = { id: string; title: string; amount: number; category: Category; date: string; note?: string };
type FormState = { title: string; amount: string; category: Category; date: string; note: string };

const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
const categoryMeta: Record<Category, { color: string; soft: string; icon: typeof Utensils }> = {
  Food: { color: '#da674e', soft: '#f7dcd2', icon: Utensils },
  Transport: { color: '#3d8f86', soft: '#d8ece7', icon: TrainFront },
  Shopping: { color: '#b78834', soft: '#f4e8bd', icon: ShoppingBag },
  Bills: { color: '#6e709c', soft: '#e3e3f0', icon: Receipt },
  Health: { color: '#ac657b', soft: '#f0dbe1', icon: HeartPulse },
  Entertainment: { color: '#c18454', soft: '#f2dfc8', icon: Film },
  Other: { color: '#76827f', soft: '#e2e7e4', icon: MoreHorizontal },
};

const makeDate = (day: number) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
};

const seedExpenses = (): Expense[] => [
  { id: 'seed-1', title: 'Morning market', amount: 18.4, category: 'Food', date: makeDate(2), note: 'Fruit, bread, and coffee' },
  { id: 'seed-2', title: 'Monthly transit pass', amount: 74, category: 'Transport', date: makeDate(3) },
  { id: 'seed-3', title: 'Corner café', amount: 6.8, category: 'Food', date: makeDate(5), note: 'A quiet table and a cortado' },
  { id: 'seed-4', title: 'Electricity bill', amount: 92.35, category: 'Bills', date: makeDate(7) },
  { id: 'seed-5', title: 'New book', amount: 24.9, category: 'Shopping', date: makeDate(9), note: 'The book I kept circling back to' },
  { id: 'seed-6', title: 'Pharmacy', amount: 16.75, category: 'Health', date: makeDate(12) },
  { id: 'seed-7', title: 'Dinner with Mira', amount: 43.2, category: 'Food', date: makeDate(15) },
  { id: 'seed-8', title: 'Cinema tickets', amount: 28, category: 'Entertainment', date: makeDate(18) },
  { id: 'seed-9', title: 'Rideshare home', amount: 12.6, category: 'Transport', date: makeDate(20) },
  { id: 'seed-10', title: 'Plants for the desk', amount: 31.5, category: 'Shopping', date: makeDate(22) },
];

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const currency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (value: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
const formatMonth = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
const defaultForm = (): FormState => ({ title: '', amount: '', category: 'Food', date: new Date().toISOString().slice(0, 10), note: '' });

function IconForCategory({ category, size = 17 }: { category: Category; size?: number }) {
  const Icon = categoryMeta[category].icon;
  return <Icon size={size} strokeWidth={1.8} />;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </WouterRouter>
  );
}

function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem('quiet-ledger-expenses');
      return stored ? JSON.parse(stored) : seedExpenses();
    } catch { return seedExpenses(); }
  });
  const [month, setMonth] = useState(() => new Date());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | Category>('All');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { localStorage.setItem('quiet-ledger-expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeMonth = monthKey(month);
  const monthExpenses = useMemo(() => expenses.filter((item) => item.date.startsWith(activeMonth)), [expenses, activeMonth]);
  const visibleExpenses = useMemo(() => monthExpenses
    .filter((item) => filter === 'All' || item.category === filter)
    .filter((item) => `${item.title} ${item.category} ${item.note ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [monthExpenses, filter, query]);
  const total = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const budget = 620;
  const remaining = Math.max(0, budget - total);
  const categoriesSummary = categories.map((category) => ({
    category,
    total: monthExpenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
  const dailyTotals = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(month.getFullYear(), month.getMonth(), Math.max(1, new Date().getDate() - (6 - index)));
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return { label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day), total: monthExpenses.filter((item) => item.date === key).reduce((sum, item) => sum + item.amount, 0) };
  });
  const maxDaily = Math.max(...dailyTotals.map((item) => item.total), 1);

  const openAdd = () => { setEditing(null); setForm(defaultForm()); setModal('add'); };
  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({ title: expense.title, amount: String(expense.amount), category: expense.category, date: expense.date, note: expense.note ?? '' });
    setModal('edit');
  };
  const submitExpense = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !amount || amount < 0 || !form.date) return;
    if (editing) {
      setExpenses((current) => current.map((item) => item.id === editing.id ? { ...item, title: form.title.trim(), amount, category: form.category, date: form.date, note: form.note.trim() || undefined } : item));
      setToast('Expense updated');
    } else {
      setExpenses((current) => [...current, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: form.title.trim(), amount, category: form.category, date: form.date, note: form.note.trim() || undefined }]);
      setToast('Expense saved to your ledger');
    }
    setModal(null);
  };
  const removeExpense = () => {
    if (!deleteId) return;
    setExpenses((current) => current.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    setToast('Expense removed');
  };

  return (
    <div className="app-shell grain flex">
      <aside className={`side-rail fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col px-6 py-7 transition-transform duration-300 lg:static lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><WalletCards size={21} /></div>
          <div><div className="display-font text-xl tracking-tight">quiet ledger</div><div className="mono-font text-[9px] uppercase tracking-[.22em] text-[hsl(var(--sidebar-foreground)/.5)]">personal finance</div></div>
        </div>
        <div className="mt-14">
          <p className="mono-font mb-4 text-[10px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.42)]">Workspace</p>
          <nav className="space-y-1">
            <button data-testid="button-nav-overview" className="flex w-full items-center gap-3 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--sidebar-accent))] px-3 py-3 text-left text-sm font-semibold"><Home size={17} /> Overview</button>
            <button onClick={() => { setToast('Reports are coming into focus'); setMobileNav(false); }} data-testid="button-nav-reports" className="flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-3 text-left text-sm text-[hsl(var(--sidebar-foreground)/.65)] transition hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"><BarChart3 size={17} /> Reports</button>
            <button onClick={() => { setToast('Preferences are saved locally'); setMobileNav(false); }} data-testid="button-nav-preferences" className="flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-3 text-left text-sm text-[hsl(var(--sidebar-foreground)/.65)] transition hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"><Settings size={17} /> Preferences</button>
          </nav>
        </div>
        <div className="mt-auto border-t border-[hsl(var(--sidebar-border))] pt-5">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center bg-[hsl(var(--accent))] text-sm font-bold text-[hsl(var(--accent-foreground))]">AK</div><div><div className="text-sm font-semibold">Alex Kim</div><div className="text-xs text-[hsl(var(--sidebar-foreground)/.5)]">just for you</div></div><button onClick={() => setToast('This local ledger does not need a sign out.')} aria-label="Sign out" data-testid="button-sign-out" className="icon-button ml-auto p-1 text-[hsl(var(--sidebar-foreground)/.5)]"><LogOut size={15} /></button></div>
        </div>
      </aside>
      {mobileNav && <button aria-label="Close navigation" data-testid="button-close-navigation" className="modal-backdrop fixed inset-0 z-30 lg:hidden" onClick={() => setMobileNav(false)} />}
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[hsl(var(--foreground)/.1)] px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3"><button aria-label="Open navigation" data-testid="button-open-navigation" onClick={() => setMobileNav(true)} className="icon-button p-2 lg:hidden"><Menu size={20} /></button><div className="lg:hidden display-font text-xl">quiet ledger</div><div className="hidden text-sm text-[hsl(var(--muted-foreground))] lg:block">A small check-in with your money.</div></div>
          <div className="flex items-center gap-2 sm:gap-4"><button aria-label="Help" data-testid="button-help" onClick={() => setToast('Every number here is yours to shape')} className="icon-button hidden p-2 text-[hsl(var(--muted-foreground))] sm:block"><CircleHelp size={18} /></button><button onClick={openAdd} data-testid="button-add-expense-header" className="primary-button flex items-center gap-2 bg-[hsl(var(--primary))] px-3 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))] sm:px-4"><Plus size={17} /> <span className="hidden sm:inline">Add expense</span><span className="sm:hidden">Add</span></button></div>
        </header>
        <div className="page-enter mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-11">
          <section className="mb-9 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div><p className="mono-font mb-3 text-[10px] uppercase tracking-[.23em] text-[hsl(var(--primary))]">Your overview</p><h1 className="display-font text-4xl leading-none tracking-tight sm:text-5xl">A clear look at<br /><span className="text-[hsl(var(--primary))]">where it went.</span></h1><p className="mt-4 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">No judgment, no noise. Just a useful little picture of your month so far.</p></div>
            <div className="flex items-center gap-1 border-b border-[hsl(var(--foreground)/.18)] pb-2"><button aria-label="Previous month" data-testid="button-previous-month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="icon-button p-2"><ArrowLeft size={17} /></button><div className="flex min-w-[150px] items-center justify-center gap-2 text-sm font-bold"><CalendarDays size={16} className="text-[hsl(var(--primary))]" />{formatMonth(month)}</div><button aria-label="Next month" data-testid="button-next-month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="icon-button p-2"><ArrowRight size={17} /></button></div>
          </section>
          <section className="grid gap-4 xl:grid-cols-[1.35fr_.72fr_.72fr]">
            <div className="panel soft-shadow relative overflow-hidden p-6 sm:p-8" style={{ backgroundColor: 'hsl(var(--sidebar))', color: 'hsl(var(--sidebar-foreground))' }}><div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border-[22px] border-[hsl(var(--accent)/.18)]" /><div className="relative"><div className="flex items-center justify-between"><span className="mono-font text-[10px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.55)]">Spent this month</span><span className="flex items-center gap-1 text-xs text-[hsl(var(--accent))]"><ArrowDownLeft size={14} /> 8.4% vs last month</span></div><div className="display-font mt-8 text-5xl tracking-tight">{currency(total)}</div><div className="mt-7 h-2 bg-[hsl(var(--sidebar-foreground)/.14)]"><div className="h-full bg-[hsl(var(--accent))] transition-all duration-700" style={{ width: `${Math.min(total / budget * 100, 100)}%` }} /></div><div className="mt-3 flex justify-between text-xs text-[hsl(var(--sidebar-foreground)/.55)]"><span>{Math.round(total / budget * 100)}% of monthly plan</span><span>{currency(budget)} plan</span></div></div></div>
            <div className="panel flex flex-col justify-between p-6"><div className="flex items-center justify-between"><span className="mono-font text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Still available</span><Sparkles size={18} className="text-[hsl(var(--primary))]" /></div><div><div className="display-font mt-6 text-4xl">{currency(remaining)}</div><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">A little room to breathe.</p></div></div>
            <div className="panel flex flex-col justify-between p-6"><div className="flex items-center justify-between"><span className="mono-font text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Entries</span><Receipt size={18} className="text-[hsl(var(--primary))]" /></div><div><div className="display-font mt-6 text-4xl">{monthExpenses.length}</div><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Small notes add up.</p></div></div>
          </section>
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="panel p-6 sm:p-7"><div className="flex items-start justify-between"><div><p className="mono-font text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Spending rhythm</p><h2 className="display-font mt-2 text-2xl">The week in lines</h2></div><span className="text-xs text-[hsl(var(--muted-foreground))]">last 7 days</span></div><div className="mt-7 flex h-40 items-end gap-2 border-b border-[hsl(var(--foreground)/.14)] sm:gap-4">{dailyTotals.map((item, index) => <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative w-full max-w-[42px]" style={{ height: `${Math.max(item.total / maxDaily * 100, item.total ? 12 : 3)}%` }}><div className="h-full w-full bg-[hsl(var(--secondary))] transition-all duration-500 hover:bg-[hsl(var(--primary))]" title={currency(item.total)} /></div><span className="text-[10px] text-[hsl(var(--muted-foreground))]">{item.label}</span><span className="mono-font hidden text-[9px] text-[hsl(var(--foreground)/.55)] sm:block">{item.total ? currency(item.total).replace('$', '') : '—'}</span></div>)}</div></div>
            <div className="panel p-6 sm:p-7"><div className="flex items-start justify-between"><div><p className="mono-font text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Where it goes</p><h2 className="display-font mt-2 text-2xl">By category</h2></div><BarChart3 size={19} className="text-[hsl(var(--primary))]" /></div><div className="mt-6 space-y-4">{categoriesSummary.length ? categoriesSummary.slice(0, 5).map(({ category, total: categoryTotal }) => <div key={category}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-semibold"><span className="grid h-6 w-6 place-items-center" style={{ backgroundColor: categoryMeta[category].soft, color: categoryMeta[category].color }}><IconForCategory category={category} size={14} /></span>{category}</span><span className="mono-font text-[10px]">{currency(categoryTotal)}</span></div><div className="h-1.5 bg-[hsl(var(--muted))]"><div className="category-bar h-full" style={{ width: `${categoryTotal / total * 100}%`, backgroundColor: categoryMeta[category].color }} /></div></div>) : <div className="py-7 text-sm text-[hsl(var(--muted-foreground))]">Your categories will take shape here.</div>}</div></div>
          </section>
          <section className="panel mt-5 overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[hsl(var(--foreground)/.1)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="mono-font text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">Your notes</p><h2 className="display-font mt-2 text-2xl">Recent expenses</h2></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-search-expenses" aria-label="Search expenses" placeholder="Search expenses" className="h-10 w-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 text-xs outline-none transition focus:border-[hsl(var(--primary))] sm:w-48" /></label><div className="relative"><select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | Category)} data-testid="select-filter-category" aria-label="Filter by category" className="h-10 w-full appearance-none border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 pr-8 text-xs outline-none focus:border-[hsl(var(--primary))] sm:w-36"><option value="All">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" /></div></div></div>
            {visibleExpenses.length ? <div className="divide-y divide-[hsl(var(--foreground)/.08)]">{visibleExpenses.map((expense, index) => <div key={expense.id} className="group transaction-row stagger-item flex items-center gap-3 px-5 py-4 sm:gap-5 sm:px-7" style={{ '--delay': `${index * 45}ms` } as CSSProperties}><div className="grid h-10 w-10 shrink-0 place-items-center" style={{ backgroundColor: categoryMeta[expense.category].soft, color: categoryMeta[expense.category].color }}><IconForCategory category={expense.category} /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{expense.title}</div><div className="mt-1 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span>{formatDate(expense.date)}</span><span className="h-1 w-1 rounded-full bg-[hsl(var(--muted-foreground)/.5)]" /><span>{expense.category}</span>{expense.note && <><span className="h-1 w-1 rounded-full bg-[hsl(var(--muted-foreground)/.5)]" /><span className="hidden truncate sm:inline">{expense.note}</span></>}</div></div><div className="mono-font text-sm font-bold">{currency(expense.amount)}</div><div className="flex gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100"><button aria-label={`Edit ${expense.title}`} data-testid={`button-edit-expense-${expense.id}`} onClick={() => openEdit(expense)} className="icon-button p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"><Pencil size={15} /></button><button aria-label={`Delete ${expense.title}`} data-testid={`button-delete-expense-${expense.id}`} onClick={() => setDeleteId(expense.id)} className="icon-button p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"><Trash2 size={15} /></button></div></div>)}</div> : <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="grid h-14 w-14 place-items-center bg-[hsl(var(--accent)/.4)] text-[hsl(var(--foreground))]"><Search size={22} /></div><h3 className="display-font mt-5 text-2xl">Nothing matches that.</h3><p className="mt-2 max-w-xs text-sm text-[hsl(var(--muted-foreground))]">Try another search, or add the next small note to your ledger.</p><button onClick={openAdd} data-testid="button-add-empty-expense" className="primary-button mt-5 bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]">Add an expense</button></div>}
            <div className="flex items-center justify-between border-t border-[hsl(var(--foreground)/.1)] px-5 py-4 sm:px-7"><span className="text-xs text-[hsl(var(--muted-foreground))]">{visibleExpenses.length} of {monthExpenses.length} entries</span><button onClick={openAdd} data-testid="button-add-expense-list" className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))] transition hover:gap-2"><Plus size={15} /> Add another</button></div>
          </section>
          <footer className="flex flex-col gap-2 py-8 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 bg-[hsl(var(--secondary-foreground))]" />Your ledger lives in this browser.</span><span className="mono-font text-[10px] uppercase tracking-[.12em]">quietly, consistently</span></footer>
        </div>
      </main>
      {modal && <ExpenseModal mode={modal} form={form} setForm={setForm} onClose={() => setModal(null)} onSubmit={submitExpense} />}
      {deleteId && <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={removeExpense} />}
      {toast && <div role="status" data-testid="status-toast" className="toast-note fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 bg-[hsl(var(--sidebar))] px-4 py-3 text-sm font-semibold text-[hsl(var(--sidebar-foreground))] soft-shadow"><Check size={16} className="text-[hsl(var(--accent))]" />{toast}</div>}
    </div>
  );
}

function ExpenseModal({ mode, form, setForm, onClose, onSubmit }: { mode: 'add' | 'edit'; form: FormState; setForm: Dispatch<SetStateAction<FormState>>; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  return <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-5"><div className="modal-card panel max-h-[95dvh] w-full overflow-y-auto bg-[hsl(var(--card))] p-6 soft-shadow sm:max-w-[520px] sm:p-8"><div className="mb-7 flex items-start justify-between"><div><p className="mono-font text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">{mode === 'edit' ? 'Make a change' : 'New note'}</p><h2 className="display-font mt-2 text-3xl">{mode === 'edit' ? 'Edit expense' : 'Add an expense'}</h2></div><button onClick={onClose} aria-label="Close expense form" data-testid="button-close-expense-modal" className="icon-button p-2"><X size={19} /></button></div><form onSubmit={onSubmit} className="space-y-5"><div><label htmlFor="expense-title" className="mb-2 block text-xs font-bold">What was it?</label><input id="expense-title" autoFocus required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} data-testid="input-expense-title" placeholder="e.g. Saturday market" className="h-12 w-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="expense-amount" className="mb-2 block text-xs font-bold">Amount</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))]">$</span><input id="expense-amount" required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} data-testid="input-expense-amount" placeholder="0.00" className="h-12 w-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-7 pr-3 text-sm outline-none focus:border-[hsl(var(--primary))]" /></div></div><div><label htmlFor="expense-date" className="mb-2 block text-xs font-bold">Date</label><input id="expense-date" required type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} data-testid="input-expense-date" className="h-12 w-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" /></div></div><div><label htmlFor="expense-category" className="mb-2 block text-xs font-bold">Category</label><div className="relative"><select id="expense-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as Category }))} data-testid="select-expense-category" className="h-12 w-full appearance-none border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" /></div></div><div><label htmlFor="expense-note" className="mb-2 block text-xs font-bold">A note <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span></label><textarea id="expense-note" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} data-testid="input-expense-note" placeholder="Anything worth remembering?" rows={3} className="w-full resize-none border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" /></div><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} data-testid="button-cancel-expense" className="px-4 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]">Cancel</button><button type="submit" data-testid="button-save-expense" className="primary-button flex items-center gap-2 bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]"><Check size={16} /> {mode === 'edit' ? 'Save changes' : 'Save expense'}</button></div></form></div></div>;
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"><div className="modal-card panel w-full max-w-[390px] bg-[hsl(var(--card))] p-7 text-center soft-shadow"><div className="mx-auto grid h-12 w-12 place-items-center bg-[hsl(var(--accent)/.45)] text-[hsl(var(--destructive))]"><Trash2 size={20} /></div><h2 className="display-font mt-5 text-2xl">Take it off the page?</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">This expense will be removed from your local ledger. It cannot be undone.</p><div className="mt-7 flex justify-center gap-3"><button onClick={onCancel} data-testid="button-cancel-delete" className="px-4 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))]">Keep it</button><button onClick={onConfirm} data-testid="button-confirm-delete" className="bg-[hsl(var(--destructive))] px-5 py-3 text-sm font-bold text-[hsl(var(--destructive-foreground))] transition hover:opacity-90">Remove expense</button></div></div></div>;
}

export default App;