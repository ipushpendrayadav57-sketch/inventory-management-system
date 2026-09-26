"use client";

import {useMemo,useState} from "react";
import type {ReactNode} from "react";
import Management from "./management";
import {LayoutDashboard,Package,Boxes,ShoppingCart,TrendingUp,RotateCcw,Receipt,WalletCards,BarChart3,FileText,Users,UserRound,BriefcaseBusiness,Settings,Search,Bell,ChevronDown,Moon,Sun,ShoppingCart as CartIcon,AlertTriangle} from "lucide-react";

type Product={sku:string;name:string;category:string;stock:number;reserved:number;cost:number;price:number;status:string};

const initial:Product[]=[
 {sku:"VNX-001",name:"Classic Analog Watch",category:"Watches",stock:3,reserved:0,cost:310,price:799,status:"Low Stock"},
 {sku:"BLT-010",name:"Leather Belt - Brown",category:"Belts",stock:6,reserved:0,cost:220,price:599,status:"Low Stock"},
 {sku:"HSO-005",name:"Hair Oil",category:"Personal Care",stock:8,reserved:1,cost:120,price:349,status:"Low Stock"},
 {sku:"PFM-004",name:"Perfume",category:"Beauty",stock:5,reserved:0,cost:380,price:899,status:"Low Stock"},
 {sku:"FWS-003",name:"Face Wash",category:"Personal Care",stock:12,reserved:2,cost:95,price:249,status:"Healthy"}
];

const nav=[
 ["Dashboard","dashboard",LayoutDashboard],["Products","products",Package],["Inventory","inventory",Boxes],
 ["Purchase","purchase",ShoppingCart],["Sales","sales",TrendingUp],["Returns","returns",RotateCcw],
 ["Expenses","expenses",Receipt],["Accounts","accounts",WalletCards],["Reports","reports",BarChart3],
 ["GST","gst",FileText],["Vendors","vendors",Users],["Customers","customers",UserRound],
 ["Employees","employees",BriefcaseBusiness],["Settings","settings",Settings]
] as const;

const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
function managementTab(key:string){if(key==="products")return "products";if(key==="inventory")return "stock";if(key==="purchase")return "purchases";if(key==="sales")return "orders";if(key==="returns")return "returns";if(key==="vendors")return "vendors";return null;}

export default function Home(){
 const [active,setActive]=useState("dashboard"),[query,setQuery]=useState(""),[dark,setDark]=useState(false);
 const products=initial;
 const filtered=useMemo(()=>products.filter(p=>(p.name+p.sku+p.category).toLowerCase().includes(query.toLowerCase())),[query]);
 const units=products.reduce((s,p)=>s+p.stock,0),value=products.reduce((s,p)=>s+p.stock*p.cost,0);
 const target=managementTab(active);
 return <main className={dark?"app dark":"app"}>
  <aside className="sidebar">
   <div className="brand"><div className="logoimg"><img src="/munim-jee-logo.svg" alt="Personal Munim Jee"/></div><div><b>Personal <span>Munim Jee</span></b><small>Business Management</small></div></div>
   <div className="workspace">MAIN MENU</div>
   <nav>{nav.map(([label,key,Icon])=><button className={active===key?"nav active":"nav"} key={key} onClick={()=>setActive(key)}><Icon size={17}/><span>{label}</span>{key==="sales"&&<em>12</em>}</button>)}</nav>
   <div className="sidebar-health"><div><i/> All systems working</div><small>Business Health</small></div><div className="version">v1.0.0</div>
  </aside>
  <section className="content">
   <header className="topbar"><div className="global-search"><Search size={16}/><input placeholder="Search products, orders, vendors..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>Ctrl K</kbd></div><div className="head-actions"><button className="circlebtn" onClick={()=>setDark(!dark)}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button><button className="circlebtn notification"><Bell size={17}/><i/></button><div className="profile"><div className="avatar">PY</div><div><b>Pushpendra Yadav</b><small>Admin</small></div><ChevronDown size={15}/></div></div></header>
   {active==="dashboard"?<Dashboard products={filtered} value={value} units={units} onGo={setActive}/>:target?<Management initialTab={target as any}/>:<ComingSoon title={nav.find(x=>x[1]===active)?.[0]||"Module"}/>}
   <footer>Personal Munim Jee v1.0 · Stock · Purchase · Sales · Accounts · GST</footer>
  </section>
 </main>
}

function Dashboard({products,value,units,onGo}:{products:Product[];value:number;units:number;onGo:(x:string)=>void}){
 return <div className="dashboard">
  <div className="page-title"><div><h1>Dashboard</h1><p>Welcome back! Here's your business overview.</p></div><button className="datebox">◫ &nbsp;01 Sep 2026 - 30 Sep 2026⌄</button></div>
  <div className="metricgrid">
   <Metric icon={<CartIcon/>} label="Total Purchase" value="₹ 2,48,320" trend="↗ 12% vs last month"/>
   <Metric icon={<BarChart3/>} label="Total Sales" value="₹ 3,25,600" trend="↗ 18% vs last month"/>
   <Metric icon={<Package/>} label="Current Stock Value" value={money(value+490000)} trend={"● "+units.toLocaleString("en-IN")+" units"}/>
   <Metric icon={<WalletCards/>} label="Pending Payments" value="₹ 1,12,450" trend="5 vendors due" danger/>
  </div>
  <div className="dashboard-grid">
   <div className="panel chartpanel"><div className="panelhead"><div><h3>Sales vs Purchase</h3><small>Monthly comparison</small></div><select><option>Last 12 Months</option></select></div><div className="legend"><span><i className="blue"/>Sales</span><span><i className="green"/>Purchase</span></div><div className="chart">
    {[["Jan",2.7,1.6],["Feb",2.1,2.8],["Mar",2.3,1.4],["Apr",2.5,1.5],["May",3.6,2.1],["Jun",1.4,2.3],["Jul",3.1,2.1],["Aug",4.6,1.7],["Sep",2.8,3.2]].map(([m,s,p])=><div className="chartcol" key={m as string}><div className="bars2"><i style={{height:(Number(s)*16)+"%"}}/><b style={{height:(Number(p)*16)+"%"}}/></div><small>{m}</small></div>)}
   </div></div>
   <div className="panel stockpanel"><div className="panelhead"><div><h3>Stock Status</h3><small>Current inventory health</small></div></div><div className="stockvisual"><div className="donut"><strong>1,280</strong><small>Units</small></div><div className="stocklegend"><span><i className="green-dot"/>In Stock <b>72%</b></span><span><i className="yellow-dot"/>Low Stock <b>18%</b></span><span><i className="red-dot"/>Out of Stock <b>10%</b></span></div></div></div>
  </div>
  <div className="dashboard-grid lower">
   <div className="panel"><div className="panelhead"><h3>Recent Transactions</h3><button className="linkbtn">View All</button></div><div className="mini-table">
    <div className="tr headrow"><span>Date</span><span>Type</span><span>Ref. No.</span><span>Party</span><span>Amount</span></div>
    <div className="tr"><span>26 Sep 2026</span><span><b className="pill sale">Sale</b></span><span>SAL-0001</span><span>Retail Customer</span><strong>₹ 2,840</strong></div>
    <div className="tr"><span>26 Sep 2026</span><span><b className="pill purchase">Purchase</b></span><span>PUR-0021</span><span>CasaDitta</span><strong>₹ 23,080</strong></div>
    <div className="tr"><span>25 Sep 2026</span><span><b className="pill sale">Sale</b></span><span>SAL-0000</span><span>Online (Flipkart)</span><strong>₹ 4,120</strong></div>
    <div className="tr"><span>25 Sep 2026</span><span><b className="pill expense">Expense</b></span><span>EXP-0012</span><span>Warehouse Rent</span><strong>₹ 12,500</strong></div>
    <div className="tr"><span>24 Sep 2026</span><span><b className="pill purchase">Purchase</b></span><span>PUR-0020</span><span>Local Vendor</span><strong>₹ 18,650</strong></div>
   </div></div>
   <div className="panel"><div className="panelhead"><h3>Low Stock Products</h3><button className="linkbtn">View All</button></div><div className="mini-table lowtable"><div className="tr headrow"><span>Product</span><span>SKU</span><span>Current</span><span>Reorder</span></div>{products.slice(0,5).map(p=><div className="tr" key={p.sku}><span><b>{p.name}</b></span><span>{p.sku}</span><span><strong className="stocknum">{p.stock}</strong></span><span>10</span></div>)}</div></div>
  </div>
  <div className="quick-actions"><h3>Quick Actions</h3><div><button onClick={()=>onGo("purchase")}><CartIcon/><span>Add Purchase</span></button><button onClick={()=>onGo("sales")}><TrendingUp/><span>Add Sale</span></button><button onClick={()=>onGo("products")}><Package/><span>Add Product</span></button><button onClick={()=>onGo("expenses")}><Receipt/><span>Add Expense</span></button></div></div>
 </div>
}

function Metric({icon,label,value,trend,danger}:{icon:ReactNode;label:string;value:string;trend:string;danger?:boolean}){return <div className="metriccard"><div className="metricicon">{icon}</div><div><small>{label}</small><strong>{value}</strong><em className={danger?"danger":""}>{trend}</em></div></div>}
function ComingSoon({title}:{title:string}){return <div className="panel coming"><AlertTriangle size={28}/><h2>{title}</h2><p>This module is reserved for the next Personal Munim Jee release.</p></div>}
