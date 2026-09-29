import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";

export async function GET(){
  const [products,purchases,orders,stock,ledger,payments,movements]=await Promise.all([
    db.product.findMany({where:{active:true},select:{id:true,sku:true,name:true,category:true,costPrice:true,sellingPrice:true,reorderLevel:true}}),
    db.purchaseOrder.findMany({select:{id:true,poNumber:true,total:true,createdAt:true,vendor:{select:{name:true}}},orderBy:{createdAt:"desc"},take:100}),
    db.order.findMany({select:{id:true,orderNumber:true,total:true,createdAt:true,channel:true,customerName:true,status:true},orderBy:{createdAt:"desc"},take:100}),
    db.stockBalance.findMany({include:{product:true,warehouse:true}}),
    db.vendorLedgerEntry.findMany({select:{vendorId:true,type:true,amount:true}}),
    db.purchasePayment.findMany({select:{purchaseId:true,amount:true}}),
    db.stockMovement.findMany({include:{product:true,warehouse:true},orderBy:{createdAt:"desc"},take:10})
  ]);

  const totalPurchase=purchases.reduce((s,p)=>s+Number(p.total),0);
  const totalSales=orders.reduce((s,o)=>s+Number(o.total),0);
  const units=stock.reduce((s,x)=>s+x.quantity,0);
  const stockValue=stock.reduce((s,x)=>s+x.quantity*Number(x.product.costPrice),0);
  const paymentByPurchase=new Map<string,number>();
  for(const p of payments) paymentByPurchase.set(p.purchaseId,(paymentByPurchase.get(p.purchaseId)||0)+Number(p.amount));
  const pendingPayments=purchases.reduce((s,p)=>s+Math.max(0,Number(p.total)-(paymentByPurchase.get(p.id)||0)),0);

  const lowStock=stock
    .map(x=>({sku:x.product.sku,name:x.product.name,category:x.product.category||"-",stock:x.quantity,reserved:x.reserved,reorder:x.product.reorderLevel}))
    .filter(x=>x.stock<=x.reorder)
    .sort((a,b)=>a.stock-b.stock)
    .slice(0,10);

  return NextResponse.json({
    metrics:{totalPurchase,totalSales,units,stockValue,pendingPayments},
    stockStatus:{
      inStock:stock.filter(x=>x.quantity>x.product.reorderLevel).reduce((s,x)=>s+x.quantity,0),
      lowStock:stock.filter(x=>x.quantity>0&&x.quantity<=x.product.reorderLevel).reduce((s,x)=>s+x.quantity,0),
      outOfStock:stock.filter(x=>x.quantity===0).reduce((s,x)=>s+1,0)
    },
    recent:[
      ...purchases.map(p=>({date:p.createdAt,type:"Purchase",ref:p.poNumber,party:p.vendor.name,amount:Number(p.total)})),
      ...orders.map(o=>({date:o.createdAt,type:"Sale",ref:o.orderNumber,party:o.customerName||o.channel,amount:Number(o.total)}))
    ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,8),
    lowStock,
    movements
  });
}