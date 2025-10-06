import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transcript = (formData.get('transcript') as string) || '';

    // Deterministic keyword-based mock reply logic
    const normalized = transcript.trim().toLowerCase();
    let reply = '';
    if (!normalized) {
      reply = 'مرحبًا! قل شيئًا بالعربية أو اكتب جملة لتجربة المحادثة.';
    } else if (normalized.includes('مرحبا') || normalized.includes('اهلا') || normalized.includes('أهلا')) {
      reply = 'أهلًا! كيف يمكنني مساعدتك اليوم؟ هل تريد ممارسة محادثة بسيطة؟';
    } else if (normalized.includes('شكرا') || normalized.includes('شكرا لك')) {
      reply = 'على الرحب والسعة! هل تود تجربة جملة أخرى؟';
    } else if (normalized.includes('اين') || normalized.includes('أين') || normalized.includes('مكان')) {
      reply = 'يمكنك أن تسأل: "أين أقرب مطعم؟" أو "كيف أصل إلى المركز؟"';
    } else {
      reply = `سمعت: "${transcript}". جيد — جرّب أن ترد على سؤالي التالي: كيف تقول "أريد قهوة" بالعربية؟`;
    }

    return NextResponse.json({ success: true, reply });
  } catch (err) {
    console.error('Demo API error:', err);
    return NextResponse.json({ error: 'Demo failed' }, { status: 500 });
  }
}
