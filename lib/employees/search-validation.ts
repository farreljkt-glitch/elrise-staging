export function parseEmployeeSearch(requestUrl:string){
  const url=new URL(requestUrl);
  const pageValue=url.searchParams.get("page")??"1";
  const q=(url.searchParams.get("q")??"").trim();
  if(!/^[1-9]\d{0,5}$/.test(pageValue)||q.length>80)
    throw new Error("Invalid employee search parameters");
  return {page:Number(pageValue),q,pageSize:50};
}
