// The only file that talks to the LLM provider.
// The provider, the model and the key come from .env:
//   process.env.LLM_BASE_URL, process.env.LLM_MODEL, process.env.LLM_API_KEY

// TODO P4: make a constant SYSTEM here: the rules for every answer (tone, length, format).
//          Then send it as the first message, before the user's message, in ask().
const SYSTEM = `말투: 존댓말(해요체)로 답한다.
길이: 한 문단, 세 문장 이내로 답한다.
형식: 목록, 제목, 굵은 글씨 같은 마크다운을 쓰지 않는다.`;
// ask("a question")  ->  the model's answer, as a string
export async function ask(question) {
  // TODO P3: write this function (see problems/P3_ask.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM },  
        { role: "user", content: question },   
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM: HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// chat([{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...])
//   ->  the model's next answer, as a string
export async function chat(history) {
  // TODO P5: write this function (see problems/P5_chat.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM }, 
        ...history,                          
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM: HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}
const SYSTEM_JSON = `
반드시 JSON 객체 하나로만 답하고, JSON 밖에는 아무 글자도 쓰지 않습니다.
키는 정확히 다음 세 개만 씁니다: "sentiment", "score", "summary".
"sentiment": 문자열 "positive", "negative", "neutral" 중 정확히 하나 (소문자 영어).
"score": 1 이상 5 이하의 정수 숫자. 5가 가장 긍정적입니다.
"summary": 후기를 요약한 한국어 한 문장 (문자열).
`;
// analyze("a review")  ->  an object, not a sentence:
//   { sentiment: "positive" | "negative" | "neutral", score: 1..5, summary: "one short sentence" }
export async function analyze(text) {
  // TODO P6: write this function (see problems/P6_json.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_JSON },  
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },    
    }),
  });
  if (!res.ok) throw new Error(`LLM: HTTP ${res.status}`);
  const data = await res.json();
  const { sentiment, score, summary } = JSON.parse(data.choices[0].message.content);
  const ok =
    ["positive", "negative", "neutral"].includes(sentiment) &&
    Number.isInteger(score) && score >= 1 && score <= 5 &&
    typeof summary === "string";
  if (!ok) throw new Error("LLM: the answer has the wrong shape");

  return { sentiment, score, summary };
}
