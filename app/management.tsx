"use client";
import {useEffect,useState} from "react";
import {Plus,Search,RefreshCw,PackagePlus,Truck,Warehouse as WarehouseIcon,ShoppingBag,AlertTriangle,ArrowDownToLine,ArrowUpFromLine} from "lucide-react";

type Product={id:string;sku:string;name:string;category?:string;costPrice:string;sellingPrice:string;mrp:string;stock:{quantity:number;reserved:number;warehouse:{name:string}}[]};
type Vendor={id:string;name:string;gstin?:string;phone?:string};
type Warehouse={id:string;code:string;name:string;city?:string};
type Order={id:string;orderNumber:string;channel:string;status:string;customerName?:string;total:string;items:{quantity:number;product:{sku:string;name:string}}[]};

const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
async function get<T>(url:string):Promise<T>{const r=await fetch(url);if(!r.ok)throw new Error("Request failed");return r.json()}

export default function Management(){
 const [tab,setTab]=useState<"products"|"purchases"|"vendors"|"warehouses"|"orders">("products");
 const [products,setProducts]=useState<Product[]>([]),[vendors,setVendors]=useState<Vendor[]>([]),[warehouses,setWarehouses]=useState<Warehouse[]>([]),[orders,setOrders]=useState<Order[]>([]);
 const [loading,setLoading]=useState(false),[search,setSearch]=useState("");
 const load=async()=>{setLoading(true);try{const [p,v,w,o]=await Promise.all([get<Product[]>("/api/products"),get<Vendor[]>("/api/vendors"),get<Warehouse[]>("/api/warehouses"),get<Order[]>("/api/orders")]);setProducts(p);setVendors(v);setWarehouses(w);setOrders(o)}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const createProduct=async()=>{const name=prompt("Product name");const sku=prompt("SKU");if(!name||!sku)return;await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,sku,costPrice:Number(prompt("Cost price","0")),sellingPrice:Number(prompt("Selling price","0")),mrp:Number(prompt("MRP","0")),category:prompt("Category","General")})});load()};
 const createVendor=async()=>{const name=prompt("Vendor name");if(!name)return;await fetch("/api/vendors",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,gstin:prompt("GSTIN","")})});load()};
 const createWarehouse=async()=>{const name=prompt("Warehouse name");const code=prompt("Warehouse code");if(!name||!code)return;await fetch("/api/warehouses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,code,city:prompt("City","")})});load()};
 const ship=async(id:string)=>{await fetch("/api/orders/"+id+"/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"SHIPPED"})});load()};
 const filtered=products.filter(p=>(p.name+p.sku+(p.category||"")).toLowerCase().includes(search.toLowerCase()));
 return <div className="manage"><div className="managebar"><div><b>Operations</b><small>Live database management</small></div><button className="refresh" onClick={load}><RefreshCw size={14}/> {loading?"Syncing":"Refresh"}</button></div>
 <div className="tabs">{[["products","Products",PackagePlus],["purchases","Purchases",ShoppingBag],["vendors","Vendors",Truck],["warehouses","Warehouses",WarehouseIcon],["orders","Orders",ArrowUpToLine]].map(([id,label,Icon]:any)=><button className={tab===id?"tab active":"tab"} onClick={()=>setTab(id)} key={id}><Icon size={15}/>{label}</button>)}</div>
 <div className="toolbar"><div className="search2"><Search size={15}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="add" onClick={tab==="products"?createProduct:tab==="vendors"?createVendor:tab==="warehouses"?createWarehouse:load}><Plus size={15}/> Add</button></div>
 {tab==="products"&&<Table title="Products" headers={["Product","SKU","Category","Stock","Available","Cost","Selling","Status"]}>{filtered.map(p=>{const q=p.stock.reduce((s,x)=>s+x.quantity,0),r=p.stock.reduce((s,x)=>s+x.reserved,0);return <tr key={p.id}><td><b>{p.name}</b></td><td>{p.sku}</td><td>{p.category||"-"}</td><td>{q}</td><td>{q-r}</td><td>{money(Number(p.costPrice))}</td><td>{money(Number(p.sellingPrice))}</td><td><Badge text={q===0?"Out of Stock":q<=20?"Low Stock":"Healthy"}/></td></tr>})}</Table>}
 {tab==="vendors"&&<Table title="Vendors" headers={["Vendor","GSTIN","Phone","Purchase Orders"]}>{vendors.map(v=><tr key={v.id}><td><b>{v.name}</b></td><td>{v.gstin||"-"}</td><td>{v.phone||"-"}</td><td>—</td></tr>)}</Table>}
 {tab==="warehouses"&&<Table title="Warehouses" headers={["Code","Warehouse","City","Status"]}>{warehouses.map(w=><tr key={w.id}><td>{w.code}</td><td><b>{w.name}</b></td><td>{w.city||"-"}</td><td><Badge text="Active"/></td></tr>)}</Table>}
 {tab==="orders"&&<Table title="Orders" headers={["Order","Channel","Customer","Items","Total","Status","Action"]}>{orders.map(o=><tr key={o.id}><td><b>{o.orderNumber}</b></td><td>{o.channel}</td><td>{o.customerName||"-"}</td><td>{o.items.reduce((s,i)=>s+i.quantity,0)}</td><td>{money(Number(o.total))}</td><td><Badge text={o.status}/></td><td><button className="ship" onClick={()=>ship(o.id)}>Ship</button></td></tr>)}</Table>}
 {tab==="purchases"&&<div className="empty"><AlertTriangle size={24}/><b>Purchase workflow ready in API</b><span>Create PO → GRN → Stock IN → Vendor payment.</span></div>}
 </div>
}
function Badge({text}:{text:string}){return <span className={"badge2 "+text.toLowerCase().replaceAll(" ","-")}>{text}</span>}
function Table({title,headers,children}:{title:string;headers:string[];children:React.ReactNode}){return <div className="managecard"><div className="mtitle"><div><h3>{title}</h3><small>Connected to PostgreSQL</small></div></div><div className="table2"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div></div>}