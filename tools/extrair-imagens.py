"""
Recorta o logo e as fotos usadas no protótipo a partir das duas imagens de referência
(referencias/referencia-1-pagina-inicial.jpg e referencias/referencia-2-catalogo.jpg)
e salva em assets/img/. Só é preciso rodar de novo se as referências mudarem.

Uso (na raiz do projeto):  python3 tools/extrair-imagens.py
Requer: pip install pillow
"""
from PIL import Image, ImageFilter
from pathlib import Path
from collections import deque
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'img'
OUT.mkdir(parents=True, exist_ok=True)
home=Image.open(ROOT / 'referencias' / 'referencia-1-pagina-inicial.jpg').convert('RGB')
cat=Image.open(ROOT / 'referencias' / 'referencia-2-catalogo.jpg').convert('RGB')
NAMES = {'emblem': 'logo-kauan-cell', 'ph_case': 'produto-capa-transparente', 'ph_charger': 'produto-carregador-usb-c', 'ph_buds': 'produto-fone-sem-fio', 'ph_film': 'produto-pelicula', 'hero': 'hero-vitrine', 'cat_cel': 'categoria-celulares', 'cat_ace': 'categoria-acessorios', 'cat_ast': 'categoria-assistencia', 'ban_left': 'banner-comunidade-logo', 'ban_right': 'banner-comunidade-cidade'}
out = {}
def enc(img, fmt='JPEG', q=84, name=None):
    return (img, fmt, q)

# --- emblema com fundo transparente (a imagem do catálogo é mais nítida)
em=cat.crop((74,8,188,108)).convert('RGBA')
em=em.resize((em.width*3,em.height*3),Image.LANCZOS)
w,h=em.size
px=em.load()
# flood fill a partir dos cantos: remove o fundo escuro em volta do emblema
seen=[[False]*h for _ in range(w)]
q=deque([(0,0),(w-1,0),(0,h-1),(w-1,h-1)])
def dark(p): return max(p[:3])<70
while q:
    x,y=q.popleft()
    if x<0 or y<0 or x>=w or y>=h or seen[x][y]: continue
    if not dark(px[x,y]): continue
    seen[x][y]=True
    q.extend([(x+1,y),(x-1,y),(x,y+1),(x,y-1)])
mask=Image.new('L',(w,h),255)
mp=mask.load()
for x in range(w):
    for y in range(h):
        if seen[x][y]: mp[x,y]=0
mask=mask.filter(ImageFilter.GaussianBlur(1.1))
em.putalpha(mask)
bbox=mask.point(lambda v:255 if v>20 else 0).getbbox()
em=em.crop(bbox)
em=em.resize((int(em.width*0.62),int(em.height*0.62)),Image.LANCZOS)
out['emblem']=enc(em,'PNG',name='emblem')

# --- fotos de produto (recorte interno para evitar os cantos dos cards)
out['ph_case']=enc(cat.crop((54,396,404,610)),name='case')
out['ph_charger']=enc(cat.crop((448,396,798,610)),name='charger')
out['ph_buds']=enc(cat.crop((54,753,404,966)),name='buds')
out['ph_film']=enc(cat.crop((448,753,798,966)),name='film')

# --- vitrine do topo: apaga o texto e os botões que vinham na imagem
hero=home.crop((0,296,591,722)).copy()
hp=hero.load()
H0=296
for x in range(0,400):
    ref=hp[x,(420-H0)]
    for y in range(0,420-H0):
        absy=y+H0
        t=max(0,(absy-392)/28)  # fade-in in the last 28px
        base=(8,8,10)
        c=tuple(int(base[i]*(1-t)+ref[i]*t) for i in range(3))
        hp[x,y]=c
# suaviza a emenda
region=hero.crop((0,0,402,130)).filter(ImageFilter.GaussianBlur(1.2))
hero.paste(region,(0,0))
out['hero']=enc(hero,q=86,name='hero')

# --- imagens dos cards de categoria
for key,(x0,x1) in {'cat_cel':(21,194),'cat_ace':(210,382),'cat_ast':(399,572)}.items():
    im=home.crop((x0,788,x1,906)).resize(((x1-x0)*2,236),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,60,2))
    out[key]=enc(im,q=86,name=key)

# --- partes do banner da comunidade
bl=home.crop((16,959,232,1099)).resize((432,280),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,50,2))
br=home.crop((426,959,575,1099)).resize((298,280),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,50,2))
out['ban_left']=enc(bl,q=84,name='ban_left'); out['ban_right']=enc(br,q=84,name='ban_right')
for key, (img, fmt, q) in out.items():
    path = OUT / (NAMES[key] + ('.jpg' if fmt == 'JPEG' else '.png'))
    if fmt == 'JPEG': img.save(path, 'JPEG', quality=q, optimize=True, progressive=True)
    else: img.save(path, 'PNG', optimize=True)
    print('salvo', path.relative_to(ROOT))
