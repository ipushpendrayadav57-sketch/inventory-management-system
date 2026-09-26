"use client";
import {useEffect,useState} from "react";
import {Plus,Search,RefreshCw,PackagePlus,Truck,Warehouse as WarehouseIcon,ShoppingBag,ArrowUpFromLine,Undo2,ReceiptText,X,ChevronRight,ChevronLeft} from "lucide-react";

type Product={id:string;sku:string;name:string;category?:string;costPrice:string;sellingPrice:string;mrp:string;stock:{quantity:number;reserved:number;warehouse:{name:string}}[]};
type Vendor={id:string;name:string;gstin?:string;phone?:string};
type Warehouse={id:string;code:string;name:string;city?:string};
type Order={id:string;orderNumber:string;channel:string;status:string;customerName?:string;total:string;items:{quantity:number;product:{sku:string;name:string}}[]};
type Purchase={id:string;poNumber:string;status:string;total:string;vendor:{name:string};warehouse:{name:string};items:{id:string;quantity:number;unitCost:string;product:{id:string;sku:string;name:string}}[]};

const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
async function get<T>(url:string):Promise<T>{const r=await fetch(url);if(!r.ok)throw new Error("Request failed");return r.json()}

export default function Management(){
 const [tab,setTab]=useState<"products"|"purchases"|"vendors"|"warehouses"|"orders"|"stock"|"returns">("products");
 const [products,setProducts]=useState<Product[]>([]),[vendors,setVendors]=useState<Vendor[]>([]),[warehouses,setWarehouses]=useState<Warehouse[]>([]),[orders,setOrders]=useState<Order[]>([]),[purchases,setPurchases]=useState<Purchase[]>([]);
 const [loading,setLoading]=useState(false),[search,setSearch]=useState(""),[modal,setModal]=useState<string|null>(null);
 const load=async()=>{setLoading(true);try{const [p,v,w,o,po]=await Promise.all([get<Product[]>("/api/products"),get<Vendor[]>("/api/vendors"),get<Warehouse[]>("/api/warehouses"),get<Order[]>("/api/orders"),get<Purchase[]>("/api/purchases")]);setProducts(p);setVendors(v);setWarehouses(w);setOrders(o);setPurchases(po)}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const filtered=products.filter(p=>(p.name+p.sku+(p.category||"")).toLowerCase().includes(search.toLowerCase()));
 const tabs:any[]=[["products","Products",PackagePlus],["purchases","Purchases",ShoppingBag],["vendors","Vendors",Truck],["warehouses","Warehouses",WarehouseIcon],["orders","Orders",ArrowUpFromLine],["stock","Stock IN/OUT",ReceiptText],["returns","Returns/RTO",Undo2]];
 const open=()=>setModal(tab==="products"?"product":tab==="vendors"?"vendor":tab==="warehouses"?"warehouse":tab==="purchases"?"purchase":tab==="stock"?"stock":tab==="returns"?"return":null);
 return <div className="manage">
  <div className="managebar"><div><b>Business Operations</b><small>Personal Munim Jee · Live ledger & inventory control</small></div><button className="refresh" onClick={load}><RefreshCw size={14}/> {loading?"Syncing":"Refresh"}</button></div>
  <div className="tabs">{tabs.map(([id,label,Icon])=><button className={tab===id?"tab active":"tab"} onClick={()=>setTab(id)} key={id}><Icon size={15}/>{label}</button>)}</div>
  <div className="toolbar"><div className="search2"><Search size={15}/><input placeholder="Search products, SKU, vendor..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="add" onClick={open}><Plus size={15}/> {tab==="stock"?"New Transaction":tab==="returns"?"New Return":"Add New"}</button></div>

  {tab==="products"&&<Table title="Product Master" headers={["Product","SKU","Category","Stock","Available","Cost","Selling","Status"]}>{filtered.map(p=>{const q=p.stock.reduce((s,x)=>s+x.quantity,0),r=p.stock.reduce((s,x)=>s+x.reserved,0);return <tr key={p.id}><td><b>{p.name}</b></td><td>{p.sku}</td><td>{p.category||"-"}</td><td>{q}</td><td>{q-r}</td><td>{money(Number(p.costPrice))}</td><td>{money(Number(p.sellingPrice))}</td><td><Badge text={q===0?"Out of Stock":q<=20?"Low Stock":"Healthy"}/></td></tr>})}</Table>}
  {tab==="purchases"&&<Table title="Purchase Orders" headers={["PO","Vendor","Warehouse","Items","Total","Status","Actions"]}>{purchases.map(po=><tr key={po.id}><td><b>{po.poNumber}</b></td><td>{po.vendor.name}</td><td>{po.warehouse.name}</td><td>{po.items.reduce((s,i)=>s+i.quantity,0)}</td><td>{money(Number(po.total))}</td><td><Badge text={po.status}/></td><td><button className="ship" onClick={()=>receive(po)}>Receive</button> <button className="ship" onClick={()=>pay(po)}>Pay</button></td></tr>)}</Table>}
  {tab==="vendors"&&<Table title="Vendor Master" headers={["Vendor","GSTIN","Phone"]}>{vendors.map(v=><tr key={v.id}><td><b>{v.name}</b></td><td>{v.gstin||"-"}</td><td>{v.phone||"-"}</td></tr>)}</Table>}
  {tab==="warehouses"&&<Table title="Warehouse Master" headers={["Code","Warehouse","City","Status"]}>{warehouses.map(w=><tr key={w.id}><td>{w.code}</td><td><b>{w.name}</b></td><td>{w.city||"-"}</td><td><Badge text="Active"/></td></tr>)}</Table>}
  {tab==="orders"&&<Table title="Orders" headers={["Order","Channel","Customer","Items","Total","Status","Action"]}>{orders.map(o=><tr key={o.id}><td><b>{o.orderNumber}</b></td><td>{o.channel}</td><td>{o.customerName||"-"}</td><td>{o.items.reduce((s,i)=>s+i.quantity,0)}</td><td>{money(Number(o.total))}</td><td><Badge text={o.status}/></td><td><button className="ship" onClick={()=>ship(o.id)}>Ship</button></td></tr>)}</Table>}
  {tab==="stock"&&<Empty icon={ReceiptText} title="Stock IN / OUT" text="Every movement is posted against a product and warehouse with reference and notes."/>}
  {tab==="returns"&&<Empty icon={Undo2} title="Returns / RTO" text="Record customer returns, choose restocking, and keep the movement auditable."/>}
  {modal&&<EntryModal kind={modal} products={products} vendors={vendors} warehouses={warehouses} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}}/>}
 </div>
}

async function post(url:string,body:any){const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Unable to save");return d}
function EntryModal({kind,products,vendors,warehouses,onClose,onSaved}:{kind:string;products:Product[];vendors:Vendor[];warehouses:Warehouse[];onClose:()=>void;onSaved:()=>void}){
 const [step,setStep]=useState(1),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const [f,setF]=useState<any>({category:"General",gstRate:"18",costPrice:"0",sellingPrice:"0",mrp:"0",city:"",quantity:"1",type:"ADJUSTMENT_IN",restock:true,method:"BANK",invoiceDate:new Date().toISOString().slice(0,10)});
 const set=(k:string,v:any)=>setF((x:any)=>({...x,[k]:v}));
 const title={product:"Add New Product",vendor:"Add New Vendor",warehouse:"Add New Warehouse",purchase:"Create Purchase Order",stock:"Stock IN / OUT Transaction",return:"Customer Return / RTO"}[kind]||"New Entry";
 const save=async()=>{setSaving(true);setError("");try{
   if(kind==="product")await post("/api/products",{name:f.name,sku:f.sku,barcode:f.barcode||undefined,category:f.category,brand:f.brand||undefined,hsn:f.hsn||undefined,gstRate:Number(f.gstRate),costPrice:Number(f.costPrice),sellingPrice:Number(f.sellingPrice),mrp:Number(f.mrp)});
   if(kind==="vendor")await post("/api/vendors",{name:f.name,gstin:f.gstin||undefined,phone:f.phone||undefined,email:f.email||undefined,address:f.address||undefined});
   if(kind==="warehouse")await post("/api/warehouses",{name:f.name,code:f.code,city:f.city||undefined});
   if(kind==="purchase")await post("/api/purchases",{vendorId:f.vendorId,warehouseId:f.warehouseId,items:[{productId:f.productId,quantity:Number(f.quantity),unitCost:Number(f.unitCost)}]});
   if(kind==="stock")await post("/api/stock/move",{productId:f.productId,warehouseId:f.warehouseId,quantity:Number(f.quantity),type:f.type,reference:f.reference||"MANUAL",notes:f.notes||"Manual transaction"});
   if(kind==="return")await post("/api/returns",{productId:f.productId,warehouseId:f.warehouseId,quantity:Number(f.quantity),restock:Boolean(f.restock)});
   onSaved();
 }catch(e){setError(e instanceof Error?e.message:"Unable to save")}finally{setSaving(false)}};
 const Field=({label,k,placeholder,type="text",required=true}:{label:string;k:string;placeholder?:string;type?:string;required?:boolean})=><label className="field"><span>{label}{required&&" *"}</span><input type={type} value={f[k]??""} placeholder={placeholder} onChange={e=>set(k,e.target.value)}/></label>;
 const Select=({label,k,children}:{label:string;k:string;children:React.ReactNode})=><label className="field"><span>{label} *</span><select value={f[k]??""} onChange={e=>set(k,e.target.value)}><option value="">Select {label}</option>{children}</select></label>;
 return <div className="modalback"><div className="modalbox">
  <div className="modalhead"><div><small>PERSONAL MUNIM JEE</small><h2>{title}</h2><p>Enter details carefully. Required fields are marked *</p></div><button className="close" onClick={onClose}><X size={20}/></button></div>
  <div className="steps"><div className={step>=1?"step on":"step"}><b>1</b><span>Basic Details</span></div>{kind==="purchase"&&<div className={step>=2?"step on":"step"}><b>2</b><span>Item Details</span></div>}<div className={step>=3?"step on":"step"}><b>{kind==="purchase"?3:2}</b><span>Review & Save</span></div></div>
  <div className="modalbody">
   {step===1&&<div className="formgrid">
    {kind==="product"&&<><Field label="Product Name" k="name" placeholder="e.g. Classic Analog Watch"/><Field label="SKU" k="sku" placeholder="e.g. VON-001"/><Field label="Barcode" k="barcode" placeholder="Optional" required={false}/><Field label="Category" k="category"/><Field label="Brand" k="brand" required={false}/><Field label="HSN" k="hsn" required={false}/><Field label="GST Rate %" k="gstRate" type="number"/><Field label="Cost Price" k="costPrice" type="number"/><Field label="Selling Price" k="sellingPrice" type="number"/><Field label="MRP" k="mrp" type="number"/></>}
    {kind==="vendor"&&<><Field label="Vendor Name" k="name" placeholder="Company / Supplier"/><Field label="GSTIN" k="gstin" required={false}/><Field label="Phone" k="phone" required={false}/><Field label="Email" k="email" type="email" required={false}/><Field label="Address" k="address" required={false}/></>}
    {kind==="warehouse"&&<><Field label="Warehouse Name" k="name" placeholder="Main Warehouse"/><Field label="Warehouse Code" k="code" placeholder="WH-01"/><Field label="City" k="city" required={false}/></>}
    {kind==="purchase"&&<><Select label="Vendor" k="vendorId">{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</Select><Select label="Warehouse" k="warehouseId">{warehouses.map(w=><option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}</Select><Field label="Invoice / Reference" k="reference" placeholder="INV-2026-001" required={false}/><Field label="Invoice Date" k="invoiceDate" type="date" required={false}/></>}
    {kind==="stock"&&<><Select label="Product" k="productId">{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</Select><Select label="Warehouse" k="warehouseId">{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</Select><Select label="Movement Type" k="type">{["PURCHASE","SALE","CUSTOMER_RETURN","PURCHASE_RETURN","TRANSFER_IN","TRANSFER_OUT","ADJUSTMENT_IN","ADJUSTMENT_OUT","DAMAGE"].map(x=><option key={x}>{x}</option>)}</Select><Field label="Quantity" k="quantity" type="number"/><Field label="Reference" k="reference" placeholder="PO / Invoice / Order No." required={false}/><Field label="Notes" k="notes" placeholder="Reason or remarks" required={false}/></>}
    {kind==="return"&&<><Select label="Product" k="productId">{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</Select><Select label="Warehouse" k="warehouseId">{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</Select><Field label="Return Quantity" k="quantity" type="number"/><label className="check"><input type="checkbox" checked={Boolean(f.restock)} onChange={e=>set("restock",e.target.checked)}/> Restock returned goods</label></>}
   </div>}
   {kind==="purchase"&&step===2&&<div className="formgrid"><Select label="Product" k="productId">{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</Select><Field label="Quantity" k="quantity" type="number"/><Field label="Unit Cost" k="unitCost" type="number" placeholder="0"/></div>}
   {((kind==="purchase"&&step===3)||(kind!=="purchase"&&step===2))&&<div className="review"><div className="reviewicon">✓</div><h3>Ready to save</h3><p>Check the entered information once. Saving will create an auditable transaction in Personal Munim Jee.</p><div className="reviewgrid">{Object.entries(f).filter(([k,v])=>v!==""&&k!=="restock").slice(0,8).map(([k,v])=><div key={k}><small>{k}</small><b>{String(v)}</b></div>)}</div></div>}
   {error&&<div className="formerror">{error}</div>}
  </div>
  <div className="modalfoot"><button className="secondary" onClick={step>1?()=>setStep(step-1):onClose}>{step>1?<><ChevronLeft size={16}/> Back</>:"Cancel"}</button>{((kind==="purchase"&&step<3)||(kind!=="purchase"&&step<2))?<button className="primary" onClick={()=>setStep(step+1)}>Next <ChevronRight size={16}/></button>:<button className="primary" disabled={saving} onClick={save}>{saving?"Saving...":"Save Entry"}</button>}</div>
 </div></div>
}
function receive(po:Purchase){const q=Number(prompt("Received quantity",String(po.items[0]?.quantity||0)));if(!q)return;fetch("/api/purchases/"+po.id+"/grn",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:po.items.map(i=>({productId:i.product.id,orderedQty:i.quantity,receivedQty:i.product.id===po.items[0]?.product.id?q:0,damagedQty:0,unitCost:Number(i.unitCost)}))})}).then(()=>location.reload())}
function pay(po:Purchase){const amount=Number(prompt("Payment amount",String(po.total)));if(!amount)return;fetch("/api/purchases/"+po.id+"/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount,method:prompt("Method","BANK")||"BANK",reference:prompt("Reference","")})}).then(()=>location.reload())}
function ship(id:string){fetch("/api/orders/"+id+"/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"SHIPPED"})}).then(()=>location.reload())}
function Badge({text}:{text:string}){return <span className={"badge2 "+text.toLowerCase().replaceAll(" ","-")}>{text}</span>}
function Empty({icon:Icon,title,text}:{icon:any;title:string;text:string}){return <div className="empty"><Icon size={28}/><b>{title}</b><span>{text}</span></div>}
function Table({title,headers,children}:{title:string;headers:string[];children:React.ReactNode}){return <div className="managecard"><div className="mtitle"><div><h3>{title}</h3><small>Connected to PostgreSQL</small></div></div><div className="table2"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div></div>}
