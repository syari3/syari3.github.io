/*
 * グレイシア語 → 日本語 翻訳フロントエンド
 * 前提:
 *   - /gule-parser.js が先に読み込まれ、parse(text) が利用できる
 *   - /gule-lexicon-confirmed.json をサイトのルートに配置する
 *   - Cloudflare Worker 側も cloudflare-worker/worker.js の内容に更新する
 *
 * 既存HTMLの input / output / input[name="mode"] / ast-view のIDを使用します。
 */
(() => {
  "use strict";

  const API_URL = "https://gule-translate.grandioso-sow.workers.dev/";
  const LEXICON_URL = "/gule-lexicon-confirmed.json";
  let lexiconPromise = null;

  async function loadLexicon() {
    if (!lexiconPromise) {
      lexiconPromise = fetch(LEXICON_URL, { cache: "no-cache" }).then(async response => {
        if (!response.ok) {
          throw new Error(`辞書の読み込みに失敗しました (${response.status})`);
        }
        return response.json();
      });
    }
    return lexiconPromise;
  }

  function getMode() {
    return document.querySelector('input[name="mode"]:checked')?.value || "japanese";
  }

  function getRelevantDictionary(text, lexicon) {
    const tokens = String(text).toLowerCase().match(/[a-z]+/g) || [];
    const relevant = {};
    for (const token of new Set(tokens)) {
      if (Object.prototype.hasOwnProperty.call(lexicon, token)) {
        relevant[token] = lexicon[token];
      }
    }
    return relevant;
  }

  function showAstIfAvailable(ast) {
    if (typeof window.showAST === "function") {
      window.showAST(ast);
    }
  }

  async function translateGule() {
    const input = document.getElementById("input");
    const output = document.getElementById("output");
    if (!input || !output) {
      console.error("翻訳画面に #input または #output が見つかりません。");
      return;
    }

    const text = input.value.trim();
    const mode = getMode();
    if (!text) {
      output.innerText = "翻訳する文章を入力してください。";
      return;
    }

    output.innerText = "翻訳中…";
    const button = document.querySelector('button[onclick*="translateGule"]');
    if (button) button.disabled = true;

    try {
      const lexicon = await loadLexicon();
      let ast = null;

      // 既存Workerのモード規約を維持: mode === "gule" は日本語→麗語。
      // それ以外は麗語→日本語なので、構文解析器を実行する。
      if (mode !== "gule") {
        if (typeof window.parse !== "function") {
          throw new Error("構文解析器 parse() が見つかりません。gule-parser.js の読み込み順を確認してください。");
        }
        ast = window.parse(text);
        showAstIfAvailable(ast);
      }

      const payload = {
        text,
        mode,
        ast,
        dictionary: getRelevantDictionary(text, lexicon)
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `翻訳APIエラー (${response.status})`);
      }
      if (typeof data.result !== "string") {
        throw new Error("翻訳APIから有効な翻訳結果が返りませんでした。");
      }
      output.innerText = data.result;
    } catch (error) {
      console.error("翻訳エラー:", error);
      output.innerText = `翻訳に失敗しました: ${error.message || error}`;
    } finally {
      if (button) button.disabled = false;
    }
  }

  // 既存HTMLの onclick="translateGule()" から呼び出せるようにする。
  window.translateGule = translateGule;
})();
