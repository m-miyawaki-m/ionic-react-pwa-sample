Ajax通信でよく出てくる「XHR（XMLHttpRequest）」という用語について、  
基礎から実務的な理解まで丁寧に説明します。

---

## 🚩【１】XHR（XMLHttpRequest）とは何か？

**XMLHttpRequest（略称: XHR）** とは、  
ブラウザ上で非同期通信（Ajax通信）を行うためのJavaScript標準オブジェクトです。

- 昔はXMLデータを取得するために作られたことから『XMLHttpRequest』という名前ですが、現在ではJSON形式が主流です。

- 『XHR』はAjax通信の本体です。  
  Ajax通信はブラウザが内部的にこのXHRオブジェクトを使ってサーバーとデータ通信します。

---

## 🚩【２】Ajaxとは？XHRとの関係は？

**Ajax**とは、『Asynchronous JavaScript and XML』の略で、  
ブラウザ画面をリロードせず、JavaScriptで非同期にデータを取得・送信する技術です。

- Ajax通信を実現するために使われるのが『XHR（XMLHttpRequest）』です。

**関係性の図解：**
```
【JavaScript（Ajax）】
    │
    └─【XHRオブジェクト】─ HTTP通信 → 【サーバー（Spring APIなど）】
```

- Ajaxは「技術の呼称」、XHRはその「実際の通信を行う仕組み」と理解すると良いです。

---

## 🚩【３】XHRの具体的な処理の流れ

XHRを使ったリクエストの基本的な流れは以下の通り：

**① XHRオブジェクト生成**
```javascript
const xhr = new XMLHttpRequest();
```

**② リクエストの初期化（open）**
```javascript
xhr.open('GET', '/api/users', true);
```

- 第1引数：HTTPメソッド（GET、POST）
- 第2引数：リクエストするURL
- 第3引数：非同期通信を指定（true）

**③ リクエストヘッダーの設定（setRequestHeader）**
```javascript
xhr.setRequestHeader('Authorization', 'Bearer token_here');
```

**④ レスポンス受け取り処理（onload, onreadystatechange）**
```javascript
xhr.onload = () => {
  if (xhr.status === 200) {
    const data = JSON.parse(xhr.responseText);
    console.log(data);
  }
};
```

**⑤ リクエスト送信（send）**
```javascript
xhr.send(); // GET時は空、POST時はボディを指定
```

---

## 🚩【４】jQueryのAjaxとXHRの関係は？

実は、**jQueryのAjax関数（`$.ajax`）** は、  
内部的にはXHRをラップ（包んで抽象化）しています。

つまり、`$.ajax`を使うと、以下のようなXHRの処理を自動的に行っています：

- XHRオブジェクト生成
- リクエスト初期化（open）
- ヘッダー設定
- レスポンス取得後のコールバック処理
- エラー処理

**jQueryの$.ajaxの中身（擬似的イメージ）：**
```javascript
$.ajax = function(options) {
  const xhr = new XMLHttpRequest();
  xhr.open(options.method, options.url, true);

  for (const header in options.headers) {
    xhr.setRequestHeader(header, options.headers[header]);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      options.success(JSON.parse(xhr.responseText));
    } else {
      options.error(xhr);
    }
  };

  xhr.send(options.data);
};
```

- jQueryを使うとXHRを直接触る必要がなく、より簡単にAjax通信ができます。

---

## 🚩【５】jQueryを使った場合にXHRを直接触ることはある？

通常のjQuery開発では、XHRを直接扱うことはほぼありません。

ただし、細かな制御や特殊な設定が必要な場合には、  
jQueryの`xhr`オプションでXHRにアクセスすることもあります。

**例：リクエスト中止の制御**
```javascript
const request = $.ajax({
  url: '/api/orders',
  method: 'GET'
});

// 通信を途中で中止する
request.abort();
```

このように、`$.ajax`はXHRオブジェクトへの操作（中止や進行状況の監視）も可能です。

---

## 🚩【６】XHRの各プロパティ・メソッドのまとめ（用語解説）

| XHRの項目 | 解説 |
|-----------|------|
| open() | リクエストの初期化（URLやHTTPメソッドの指定） |
| send() | リクエストを送信（ボディデータ） |
| setRequestHeader() | HTTPヘッダーを設定 |
| onload | レスポンスを正常に受信した際のコールバック |
| onerror | 通信エラー発生時のコールバック |
| readyState | 通信状態（0:未初期化、1:読込中、2:読み込み済み、3:対話可能、4:完了） |
| status | HTTPステータスコード（200成功、404未検出等） |
| responseText | 受信したデータをテキストで取得 |

---

## 🚩【７】XHRでリクエストヘッダーやボディを使う例

実際にSpring APIにリクエスト送信する際の例：

**XHRを使ったPOSTリクエストの例（JSON形式）**
```javascript
const xhr = new XMLHttpRequest();
xhr.open('POST', '/api/users', true);

// ヘッダー設定
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Authorization', 'Bearer token_here');

// レスポンス処理
xhr.onload = () => {
  if (xhr.status === 200) {
    console.log(JSON.parse(xhr.responseText));
  }
};

// リクエストボディを送信（JSON）
xhr.send(JSON.stringify({
  userId: 123,
  userName: '山田太郎'
}));
```

---

## 🚩【まとめ（XHRの理解ポイント）】

- **XHRはブラウザからHTTP通信（Ajax通信）を行う標準的なJavaScriptオブジェクト**。
- 通常はjQueryの`$.ajax`などが内部でXHRを使っており、直接触る必要は少ない。
- リクエストヘッダーやボディなどの情報をXHRオブジェクトに設定し、サーバーとデータをやり取りする仕組み。

- 実務では`$.ajax`などを使って通信を簡単に実装しますが、  
  内部では『XHRが実際の通信を行っている』という理解が大事です。

以上を理解しておくと、API通信の仕組みがより明確になります。