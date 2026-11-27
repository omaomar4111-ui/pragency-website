// functions/api/store/checkout.js
// معالجة طلبات الشراء، خصم المخزون الذري في D1، إشعار Telegram، وتوليد رابط الواتساب المباشر

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: "Database DB not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { customer, items, paymentMethod } = body;

  if (!customer || !customer.name || !customer.phone || !items || !items.length) {
    return new Response(JSON.stringify({ error: "بيانات العميل (الاسم والهاتف) وتفاصيل القطع مطلوبة" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 1. حساب المبالغ بدقة
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);
    const discount = items.length >= 3 ? Math.round(subtotal * 0.10 * 100) / 100 : 0;
    const shipping = subtotal >= 500 ? 0 : 50;
    const total = subtotal - discount + shipping;

    const orderId = "ord_" + Date.now();
    const orderNumber = "PR-" + Math.floor(100000 + Math.random() * 900000);

    // 2. تحديث المخزون الذري (Atomic Inventory Deduction in D1)
    for (const it of items) {
      if (it.productId && it.size) {
        await db.prepare(`
          UPDATE store_variants 
          SET stock_quantity = MAX(0, stock_quantity - ?)
          WHERE product_id = ? AND size = ?
        `).bind(it.quantity || 1, it.productId, it.size).run();
      }
    }

    // 3. حفظ الطلب في جدول store_orders
    await db.prepare(`
      INSERT INTO store_orders (
        id, order_number, customer_name, customer_email, customer_phone,
        shipping_address, city, subtotal, discount, shipping, total,
        status, payment_method, items_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      orderId,
      orderNumber,
      customer.name,
      customer.email || null,
      customer.phone,
      customer.address || "غير محدد",
      customer.city || "Cairo",
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod || "cod",
      JSON.stringify(items)
    ).run();

    // 4. توليد رابط WhatsApp مباشر للعميل لتأكيد الشحن الفوري
    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(
      `مرحباً ${customer.name} 👋 تم استلام طلبك رقم (${orderNumber}) في متجر PR STORE بنجاح!\n` +
      `إجمالي الطلب: $${total.toFixed(2)} (${paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة/تحويل'})\n` +
      `سيتم تجهيز الشحنة إلى: ${customer.city} - ${customer.address}.\nشكراً لتسوقك معنا ⚡`
    );
    const whatsappLink = `https://wa.me/201000000000?text=${waText}`;

    // 5. إرسال تنبيه Telegram فوري للإدارة في الخلفية
    context.waitUntil(sendTelegramOrderNotification(env, {
      orderNumber,
      customer,
      items,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod: paymentMethod === 'cod' ? 'الدفع عند الاستلام (COD)' : 'بطاقة بنكية / InstaPay'
    }));

    return new Response(JSON.stringify({
      success: true,
      orderNumber,
      orderId,
      total,
      whatsappLink,
      message: "تم تسجيل طلبك وحجز المخزون بنجاح!"
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "فشل إتمام الطلب: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function sendTelegramOrderNotification(env, order) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID || "5715939844";

  if (!token || !chatId) return;

  const itemsList = order.items.map((it, idx) => {
    return `   ${idx + 1}. *${it.productName || it.name}* | مقاس: \`${it.size || "M"}\` × ${it.quantity} ($${(it.price * it.quantity).toFixed(2)})`;
  }).join("\n");

  const text = `🛍️ *طلب شراء جديد على PR STORE!* ⚡
━━━━━━━━━━━━━━━━━━
🔢 *رقم الطلب:* \`${order.orderNumber}\`
👤 *العميل:* ${order.customer.name}
📞 *الهاتف:* \`${order.customer.phone}\`
📍 *العنوان:* ${order.customer.city || ""} - ${order.customer.address || ""}
💳 *طريقة الدفع:* ${order.paymentMethod}

📦 *القطع المحجوزة:*
${itemsList}

━━━━━━━━━━━━━━━━━━
💵 *المجموع الفرعي:* $${order.subtotal.toFixed(2)}
🏷️ *خصم الحزمة (10%):* -$${order.discount.toFixed(2)}
🚚 *الشحن:* $${order.shipping.toFixed(2)}
💰 *الإجمالي المستحق:* *$${order.total.toFixed(2)}*
━━━━━━━━━━━━━━━━━━
⏱️ _تاريخ الطلب: ${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}_`;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Telegram notification error:", err);
  }
}
