exports.handler = async function (event, context) {
  console.log('Function invoked:', event.httpMethod);
  console.log('Environment check - TG_BOT_TOKEN exists:', !!process.env.TG_BOT_TOKEN);
  console.log('Environment check - TG_CHAT_ID exists:', !!process.env.TG_CHAT_ID);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const token = process.env.TG_BOT_TOKEN;
    const chatId = process.env.TG_CHAT_ID;

    if (!token || !chatId) {
      console.error('Missing environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'Missing env vars' })
      };
    }

    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'Invalid JSON' })
      };
    }

    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const lesson = String(data.lesson || '').trim();
    const comment = String(data.comment || '').trim();

    console.log('Received data:', { name, phone, lesson, comment: comment ? 'yes' : 'no' });

    if (!name || !phone) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'Validation failed' })
      };
    }

    const message =
      '🔔 НОВАЯ ЗАЯВКА!\n\n' +
      '👤 Имя: ' + name + '\n' +
      '📞 Телефон: ' + phone + '\n' +
      '📚 Занятие: ' + (lesson || '—') + '\n' +
      '💬 Комментарий: ' + (comment || '—');

    const fetch = globalThis.fetch || require('node-fetch');
    const tgRes = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    console.log('Telegram response status:', tgRes.status);

    if (!tgRes.ok) {
      const text = await tgRes.text();
      console.error('Telegram error:', text);
      return {
        statusCode: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'Telegram error', details: text.slice(0, 1000) })
      };
    }

    console.log('Message sent successfully');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    console.error('Internal error:', err.message);
    console.error(err.stack);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: false, error: 'Internal error', details: err.message })
    };
  }
};
