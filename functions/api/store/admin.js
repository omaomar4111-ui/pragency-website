// functions/api/store/admin.js
// إدارة المتجر عبر الـ Edge API (المنتجات، الإطلالات، والطلبات)

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
  }

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "products"; // products | looks | orders
  const method = request.method;

  try {
    // ----------------------------------------
    // 1. GET Requests
    // ----------------------------------------
    if (method === "GET") {
      if (resource === "products") {
        const res = await db.prepare("SELECT * FROM store_products ORDER BY created_at DESC").all();
        return jsonResponse(res.results || []);
      }
      if (resource === "looks") {
        const res = await db.prepare("SELECT * FROM store_looks ORDER BY look_number ASC").all();
        return jsonResponse(res.results || []);
      }
      if (resource === "orders") {
        const res = await db.prepare("SELECT * FROM store_orders ORDER BY created_at DESC").all();
        return jsonResponse(res.results || []);
      }
    }

    // ----------------------------------------
    // 2. POST Requests (Add new product or look)
    // ----------------------------------------
    if (method === "POST") {
      const data = await request.json();

      if (resource === "products") {
        const { id, name, type, vendor, price, image, sizes, colors } = data;
        await db.prepare(`
          INSERT INTO store_products (id, name, type, vendor, base_price, image_url, sizes_json, colors_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, name, type || "Apparel", vendor || "PR STORE", price, image,
          JSON.stringify(sizes || ["S", "M", "L", "XL"]),
          JSON.stringify(colors || [])
        ).run();

        // إنشاء variants تلقائية للمنتج
        const szList = sizes || ["S", "M", "L", "XL"];
        for (const sz of szList) {
          const sku = `${id.toUpperCase()}-${sz}`;
          const varId = Date.now() + Math.floor(Math.random() * 10000);
          await db.prepare(`
            INSERT INTO store_variants (id, product_id, sku, size, color, stock_quantity, is_available)
            VALUES (?, ?, ?, ?, 'Default', 20, 1)
          `).bind(varId, id, sku, sz).run();
        }

        return jsonResponse({ success: true, message: "Product created" }, 201);
      }

      if (resource === "looks") {
        const { name, description, modelSrc640, modelSrcset1080, bundleOriginalPrice, bundleDiscountedPrice, productIds, pins } = data;
        const countRes = await db.prepare("SELECT count(*) as cnt FROM store_looks").first();
        const nextLookNum = (countRes?.cnt || 0) + 1;

        await db.prepare(`
          INSERT INTO store_looks (
            look_number, name, description, model_src_640, model_srcset_1080,
            bundle_original_price, bundle_discounted_price, pieces_label,
            product_ids_json, pins_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          nextLookNum, name, description, modelSrc640, modelSrcset1080 || modelSrc640,
          bundleOriginalPrice || 547.00, bundleDiscountedPrice || 492.30,
          `${(productIds || []).length} pieces`,
          JSON.stringify(productIds || []),
          JSON.stringify(pins || [])
        ).run();

        return jsonResponse({ success: true, message: "Look created" }, 201);
      }
    }

    // ----------------------------------------
    // 3. DELETE Requests
    // ----------------------------------------
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return jsonResponse({ error: "ID is required" }, 400);

      if (resource === "products") {
        await db.prepare("DELETE FROM store_products WHERE id = ?").bind(id).run();
        await db.prepare("DELETE FROM store_variants WHERE product_id = ?").bind(id).run();
        return jsonResponse({ success: true, message: "Product deleted" });
      }

      if (resource === "looks") {
        await db.prepare("DELETE FROM store_looks WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true, message: "Look deleted" });
      }
    }

    // ----------------------------------------
    // 4. PATCH Requests (Update status)
    // ----------------------------------------
    if (method === "PATCH") {
      const { id, status } = await request.json();
      if (resource === "orders") {
        await db.prepare("UPDATE store_orders SET status = ? WHERE id = ?").bind(status, id).run();
        return jsonResponse({ success: true, message: "Order status updated" });
      }
    }

    return jsonResponse({ error: "Method or resource not supported" }, 405);

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, PATCH, OPTIONS"
    }
  });
}
