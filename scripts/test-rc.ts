async function testRC() {
  const url = 'https://www.royalcanin.com/br/cats/products/retail-products/hairball-care-gravy-4158';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('HTML length:', text.length);
  console.log('Includes "carne de salmão"?', text.toLowerCase().includes('carne de salmão'));
  console.log('Includes "salmão"?', text.toLowerCase().includes('salmão'));
  console.log('Includes "Análise Garantida"?', text.toLowerCase().includes('análise garantida'));
  console.log('Includes "proteína bruta"?', text.toLowerCase().includes('proteína bruta'));

  // Se não estiver no HTML cru, vamos ver se há chamadas de API ou scripts JSON
  const matches = text.match(/https:\/\/[^\"'\s]+api[^\"'\s]+/g);
  if (matches) {
    console.log('Possible API URLs:', matches.slice(0, 5));
  }
}

testRC();
