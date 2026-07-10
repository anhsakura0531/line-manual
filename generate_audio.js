const fs = require('fs');
const path = require('path');

const SPEAKER_ID = 8; // 春日部つむぎ ノーマル
const OUT_DIR = path.join(__dirname, 'audio');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const SPEECH_TEXT = {
  basic: `基本について説明します。LINEは、クライアントさんの目標を達成するためのコミュニケーションツールです。
お客様は感情を表に出さずに話すことが多いので、私たちはLINE上で相手の感情を読み取るよう心がけましょう。
相手から不安の自己開示があったときの返信は、感謝、共感、承認、ヒアリングの順番で作ります。
共感のところでは、いきなり励ますのはNGです。ヒアリングでは、すぐに解決策を出さないようにしましょう。
LINE対応に一人で対応できるようになるまでは、LINEエフビーシートに記入し、たまったらSlackでリーダーに確認をお願いし、チェックがついたら送信してください。`,

  accounts: `使うアカウントとシステムについてです。
Salesforceアカウントと、LINEアカウントの2つを使います。ログイン情報はページ内の表を確認してください。
開けない場合は、ブラウザをシークレットモードにして試してみてください。
使うシステムは3つあります。LINE自動化システムくん、LINE添削・エフビーシステム、リテンション作成・添削システムです。
それぞれのリンクはページ内にありますので、そちらから開いてください。`,

  emoji: `絵文字の意味についてです。
王冠の絵文字は、WH本気プランのお客様です。私たちが基本的に対応するのは、このタグがついた方たちです。
ハートは、保険に加入しているお客様です。
青い四角は、マイページ登録した人です。
カエルは、追加の契約系のお客様で、これは基本的に私たちではなくセールスが対応します。
三角は、キャンセルの人です。
星は、お客様のプランの金額帯を表していて、星が多いほど、プランにお金をかけてくれているお客さんです。`,

  replies: `主な返信内容についてです。
まず学習内容ですが、これは自分たちで返信します。他のコーチへの共有や報告があれば、スレッドで行いましょう。

次に、面談調整です。必ず、何の面談か、誰との面談かを最初に確認してください。
コーチとの面談の場合は、日程を調整してSlackで担当コーチに報告し、日程が確定したら、面談を行うコーチの面談URLをお客様に送付します。
コーチ以外との面談の場合は、誰との面談かを確認したうえで、SFAで担当部署に依頼を送り、お客様に一次返信をします。

次に、VISA関連はCS部署に報告して一次返信します。
その他、コーチ内で対応できないものは、CS宛てにSFAを飛ばします。
SFAの飛ばし方はあとで丁寧に教えますので、周りのインターン生に依頼してください。

入金報告があった場合は、テンプレートを送付するだけで大丈夫です。ただし、入金が遅れる場合のご連絡などは緊急度が高いので、担当者へ共有してください。

説明会については、基本的にコーチング内で返信し、わからなければ社員さんに確認しましょう。

ネイティブキャンプ関連のトラブルがあった場合は、Slackでヨレさんをメンションして、再登録をお願いする旨を送ります。`,

  retention: `リテンションについてです。
リテンションとは、お客様のモチベーションを維持し、学習を継続してもらうために、私たちコーチがLINEを送り、コミュニケーションをとることです。
3日に一度、ペアでお客様に返信できているか確認しましょう。これまでの人のリテンションを見て、温度感を合わせるのも大切です。
LINEノートに、リテンションで意識することが書いてある場合もあるので、必ずチェックしてください。
全然連絡を返してくれない人には、リテンションしない方がいい場合もあります。しっかり文面を見て、コーチと相談しましょう。
具体的な文例は、ページ内の3つのパターンを参考にしてください。`,

  coaches: `コーチ番号、面談URL、日程調整URLの一覧です。
詳しい内容はページ内の表にまとめていますので、必要なときに確認してください。`,

  other: `その他の項目についてです。
渡航日が変更になるときは、SFAの渡航日を編集してください。保険関連は、渡航時期がずれると契約が変わる場合があるので、必ずSFAを飛ばしましょう。VISAは、渡航日が変わる場合は特に注意してください。
WHに関する様々な質問があったときは、WH国別情報のページから情報を探して返信してください。情報がなければ、自分で調べるか、詳しい方に聞きましょう。`,
};

async function synthesize(text, speakerId) {
  const queryRes = await fetch(`http://localhost:50021/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`, { method: 'POST' });
  if (!queryRes.ok) throw new Error('audio_query failed: ' + queryRes.status);
  const query = await queryRes.json();

  const synthRes = await fetch(`http://localhost:50021/synthesis?speaker=${speakerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!synthRes.ok) throw new Error('synthesis failed: ' + synthRes.status);
  const buffer = Buffer.from(await synthRes.arrayBuffer());
  return buffer;
}

(async () => {
  for (const [key, text] of Object.entries(SPEECH_TEXT)) {
    process.stdout.write(`Generating ${key}... `);
    const buf = await synthesize(text.replace(/\n/g, '　'), SPEAKER_ID);
    const outPath = path.join(OUT_DIR, `${key}.wav`);
    fs.writeFileSync(outPath, buf);
    console.log(`done (${(buf.length / 1024).toFixed(0)} KB)`);
  }
  console.log('All audio files generated in', OUT_DIR);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
