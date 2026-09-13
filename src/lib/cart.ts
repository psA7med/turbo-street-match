import { useEffect, useState } from "react";

export type CartLine={variantId:string;productId:string;slug:string;name:string;image:string|null;color:string;size:string;sku:string;unitPrice:number;quantity:number};
const key="turbo-cart-v1";
function read():CartLine[]{if(typeof window==="undefined")return [];try{return JSON.parse(localStorage.getItem(key)??"[]") as CartLine[]}catch{return []}}
function write(lines:CartLine[]){localStorage.setItem(key,JSON.stringify(lines));window.dispatchEvent(new Event("turbo-cart"))}
export function addCartLine(line:CartLine){const lines=read();const found=lines.find(x=>x.variantId===line.variantId);if(found)found.quantity=Math.min(found.quantity+line.quantity,10);else lines.push(line);write(lines)}
export function setCartQuantity(variantId:string,quantity:number){write(read().map(x=>x.variantId===variantId?{...x,quantity}:x).filter(x=>x.quantity>0))}
export function removeCartLine(variantId:string){write(read().filter(x=>x.variantId!==variantId))}
export function clearCart(){write([])}
export function useCart(){const [lines,setLines]=useState<CartLine[]>([]);useEffect(()=>{const sync=()=>setLines(read());sync();window.addEventListener("storage",sync);window.addEventListener("turbo-cart",sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("turbo-cart",sync)}},[]);return {lines,count:lines.reduce((n,x)=>n+x.quantity,0),subtotal:lines.reduce((n,x)=>n+x.quantity*x.unitPrice,0)}}