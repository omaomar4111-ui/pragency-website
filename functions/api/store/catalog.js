// functions/api/store/catalog.js
// يعيد الكتالوج الكامل للإطلالات والمنتجات من Cloudflare D1 للـ Runway Storefront

export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: "Database binding DB not found" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 1. جلب الإطلالات النشطة مرتبة
    const looksQuery = await db.prepare(
      "SELECT * FROM store_looks WHERE is_active = 1 ORDER BY look_number ASC"
    ).all();

    // 2. جلب جميع المنتجات النشطة
    const productsQuery = await db.prepare(
      "SELECT * FROM store_products ORDER BY created_at DESC"
    ).all();

    // 3. جلب جميع المتغيرات (Variants)
    const variantsQuery = await db.prepare(
      "SELECT * FROM store_variants WHERE is_available = 1"
    ).all();

    const variantsByProduct = {};
    for (const v of variantsQuery.results || []) {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
      variantsByProduct[v.product_id].push({
        id: String(v.id),
        sku: v.sku,
        size: v.size,
        color: v.color,
        colorHex: v.color_hex,
        stock: v.stock_quantity,
        a: Boolean(v.is_available),
        o: [v.size]
      });
    }

    const looks = (looksQuery.results || []).map(l => ({
      id: l.id,
      number: l.look_number,
      name: l.name,
      description: l.description,
      modelSrc640: l.model_src_640,
      modelSrcset1080: l.model_srcset_1080,
      image: l.model_srcset_1080,
      bundleOriginalPrice: l.bundle_original_price,
      bundleDiscountedPrice: l.bundle_discounted_price,
      piecesLabel: l.pieces_label,
      products: JSON.parse(l.product_ids_json || "[]"),
      pins: JSON.parse(l.pins_json || "[]")
    }));

    const items = (productsQuery.results || []).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      vendor: p.vendor,
      price: p.base_price,
      image: p.image_url,
      h: p.height_ratio || 400,
      sizes: JSON.parse(p.sizes_json || "[]"),
      colors: JSON.parse(p.colors_json || "[]"),
      isNew: Boolean(p.is_new),
      url: p.shop_url || "#",
      variants: variantsByProduct[p.id] || []
    }));

    const responsePayload = {
      source: new URL(request.url).origin,
      looks,
      items
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
