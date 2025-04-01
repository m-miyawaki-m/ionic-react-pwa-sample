既存のバックエンドAPI（Java + Spring）に対して `GET/POST` 通信するPWA（Progressive Web App）を、React + jQuery（AJAX）で構築する際の注意点を、**フロントエンドとバックエンドの両面**から整理します。

---

## ✅ 全体設計での注意点

| 観点 | 注意点 |
|------|--------|
| **責務分離** | 通信（AJAX）と画面更新（DOM）は切り離す。ReactはUI更新に集中し、通信結果は `state` で管理する |
| **状態管理** | jQueryの成功コールバックで直接DOMを書き換えず、Reactの `useState` で状態を更新して表示に反映する |
| **セキュリティ** | API通信時は認証トークン（例：JWT）をリクエストヘッダーに付与。CORSやCSRF対策も忘れずに |
| **段階的な移行** | jQueryベースの旧コードと混在する場合、Reactが管理するDOMにはjQueryで触らない |

---

## 🔌 通信処理の実装に関する注意点

### ① jQueryのAJAXをReactコンポーネントで使う場合

```tsx
useEffect(() => {
  $.ajax({
    url: '/api/data',
    method: 'GET',
    success: (res) => setData(res),
    error: (e) => console.error(e)
  });
}, []);
```

- **Reactで`useEffect`内にまとめる**ことで、副作用として扱える
- **成功時は`state`を更新**してReactで再描画
- 直接`$('#list').html(...)`のような操作はNG

### ② 将来的には `fetch` や `axios` への移行を検討

- `fetch` なら軽量、`axios` ならIE対応・エラーハンドリングがしやすい
- 段階的に `apiClient.js` などを導入して、呼び出し方法を統一するのが理想

---

## 🧱 バックエンドAPIとの整合性

| 項目 | 説明 |
|------|------|
| **リクエスト形式** | フロントが送る形式（JSON, Formなど）がSpringのControllerで正しく受け取れるよう調整（`@RequestBody` vs `@RequestParam`） |
| **CORS設定** | バックエンドが別ドメインの場合、Springの`@CrossOrigin`やWebMvcConfigurerでCORSを許可する |
| **バリデーション** | バックエンド側でBean Validation（`@Valid`, `@NotNull`など）を実施。エラーはJSON形式で返すとReact側で扱いやすい |

---

## 📦 UI更新の基本方針

- 通信成功 → `state`更新 → JSXで表示更新
- 通信失敗 → `error state`に保存 → エラーメッセージ表示
- ボタン連打防止やローディング制御も `state`で行う

```tsx
const [loading, setLoading] = useState(false);

const fetchData = () => {
  setLoading(true);
  $.ajax({
    url: '/api/something',
    success: (res) => {
      setData(res);
      setLoading(false);
    },
    error: () => setLoading(false)
  });
};
```

---

## 🚫 共存時のアンチパターン例

| アンチパターン | なぜ危険か |
|----------------|------------|
| jQueryでReact管理下のDOMを変更 | 仮想DOMと現実DOMの不整合が起き、意図しない再描画や破損が発生 |
| jQueryでReactコンポーネントのイベントをハンドリング | イベントが二重に発火したり、React側の制御が効かなくなる |

---

## ✅ PWAとしての注意点（React + jQueryでも有効）

| 項目 | 内容 |
|------|------|
| **HTTPS化** | Service Worker有効化にはHTTPS必須（ローカルは `localhost` 可） |
| **キャッシュ戦略** | API通信に対して、Service Workerでキャッシュを導入するなら、GET/POSTで扱いが変わる点に注意 |
| **オフライン対応** | POST通信はIndexedDBなどで一時保存→オンライン時同期、などを検討 |

---

## 🧠 まとめ：React + jQuery + Java APIのベストプラクティス

1. **通信処理は`useEffect`やイベント内にまとめ、結果はReactのstateで管理**
2. **ReactがレンダリングするDOMにはjQueryで一切触れない**
3. **UI操作（表示/非表示・無効化）はstateで制御し、DOM命令は避ける**
4. **将来的にjQueryの通信はfetchやaxiosへ移行できる構造を目指す**
5. **バックエンドAPIとのリクエスト/レスポンス整合性を常に確認する**

---

もし、具体的な画面構成やAPI仕様があれば、それに合わせたサンプルコードや改善ポイントを一緒に作ることもできます！



ありがとうございます。既存の業務システムと統合しつつ、React + jQuery（AJAX）でPWAを構築する際の注意点について、フロントエンドとバックエンドの両面から、業務レベルでの詳細な解説をまとめます。

内容には、既存のjQuery資産との共存、Java + Springバックエンドとの整合性、PWAとしての要件への対応を含めて網羅的に説明します。しばらくお待ちください。

# React + jQuery（AJAX）で業務用PWAを構築する際の技術的注意点とベストプラクティス

## 全体設計の観点

### 責務分離とアーキテクチャ設計
ReactとjQueryを併用する場合は、フロントエンドの責務分離を明確にすることが重要です。ReactコンポーネントはUI描画や状態管理を担当し、jQueryはどうしても必要な既存プラグインやDOM操作に限定するのが望ましいです ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=%2F%2F%20MyNavBar,react%20components))。たとえば既存のjQueryコードで構築された機能がある場合、それらをラップするReactコンポーネントを作成し、内部で必要最小限のjQuery処理を行うようにします。ReactとjQueryのDOM操作が干渉し合わないように領域を分け、相互に他方の管理下にあるDOM要素を直接操作しないことが原則です ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=%2F%2F%20MyNavBar,react%20components))。新規開発部分は可能な限りReactベースで実装し、ビューの更新はReactの仮想DOMを通じて行うことで、一貫性と保守性を確保します。

バックエンドとの役割分担も明確にします。フロントエンド（React/jQuery）は表示ロジックとユーザー操作処理、AJAX経由でのデータ取得/送信を担当し、バックエンド（Spring）はビジネスロジックやデータ永続化、API提供を責務とします。PWAアーキテクチャでは、さらにサービスワーカーがネットワーク通信とキャッシュの仲介という責務を負います。これらフロント、バック、サービスワーカーの役割を明確化し、それぞれが適切に連携するように設計します。

### 状態管理の戦略
状態管理はReactを中心に行い、一元的な**ソースオブトゥルース（単一の真実の情報源）**を保つことが重要です。Reactコンポーネントの状態（State）や必要に応じてReduxなどの状態管理ライブラリ、Context APIを用いて、アプリ全体のUI状態を管理します。jQueryでDOMから値を読み取ったり書き換えたりして状態管理をすることは避け、必ずReactのstateにデータを保持し、Reactの再レンダリングによってUIを更新するようにします。こうすることで、Reactが持つ状態と実際のDOM表示がずれるリスクを低減できます ([How to use jQuery with React the right way | by Raul T | Medium](https://medium.com/@raultelbisz/how-to-use-jquery-with-react-the-right-way-8e7db1a1b9b#:~:text=found%20the%20top%20answer%20on,That%E2%80%99s%20why%20if%20it%E2%80%99s%20possible))。既存のjQueryプラグインが内部で状態を持つ場合は、React側のstateと同期する仕組みを検討します。また、必要に応じてカスタムフックやイベント発火を利用して、jQuery側のイベントをキャッチしてReactの状態変更につなげることも検討します。複雑なアプリではグローバル状態管理を検討し、フロントエンド全体で一貫したデータの流れ（例えばFluxパターンやReduxストア）を維持するとよいでしょう。

### セキュリティの考慮
セキュリティ面では、まず**HTTPSの徹底**が重要です。PWAはセキュアなコンテキストでのみ動作し、サービスワーカーの登録もHTTPS上でしか行えません ([Using Service Workers - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#:~:text=Service%20workers%20are%20enabled%20by,origin%20by%20browsers%20as%20well))。そのため、本番環境は必ずHTTPS化し、社内業務用であっても自己署名証明書ではなく信頼された証明書を使用します（開発時は`localhost`が例外的に許可されます）。加えて、フロントエンドとバックエンドの通信では**API認証・認可**を適切に実装します。例えばJWTトークンやセッションIDを用いた認証を行い、AJAX通信時に資格情報をヘッダーに含めるか、または`XHR`/fetchの`credentials`オプションを使用してクッキー送信を許可します。Spring Securityを利用している場合、CSRF対策として発行されるトークンをAJAXリクエストに含める（例えばカスタムヘッダー`X-CSRF-TOKEN`に埋め込む）ことも検討します。フロントエンドではReactが基本的にXSS対策としてJSX文字列をエスケープしますが、jQueryで直接DOMにHTML文字列を挿入する場合は入力値のサニタイズを徹底してください。不用意に`innerHTML`やjQueryの`html()`で信頼できないデータを挿入するとXSSのリスクがあります。さらに、サービスワーカーやキャッシュには機密情報を保存しない、あるいは暗号化するなどの配慮も必要です。例えば認証トークンや個人情報が含まれるAPIレスポンスは`Cache Storage`に保存しない、どうしても保存する場合は有効期限を短く設定するなど工夫します。バックエンドとの通信には適切なバリデーションとエラーハンドリングを実装し、不正なリクエストや想定外の入力に対しても安全に対処できるようにします。

### 段階的移行のアプローチ
既存のjQuery資産を活かしつつReactへ段階的に移行するには、**インクリメンタルな統合**を行います。具体的には、既存のサーバーサイドレンダリングやjQueryによるDOM構築部分のうち、まず一部のUIコンポーネントをReact化していく方法が考えられます ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=Migration%20could%20be%20done%20like,eg%2C%20initially%20you%20could%20do)) ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=%2F%2F%20MyNavBar,react%20components))。例えば、既存ページの一部に`<div id="react-root"></div>`のようなコンテナを用意し、そこに対して`ReactDOM.render(<MyComponent/>, document.getElementById('react-root'))`でReactコンポーネントをマウントします ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=And%20React%20side%20could%20look,like%20this))。それ以外の部分は従来どおりjQueryが管理する形です。このとき**注意すべきは、React管理下のDOMをjQueryが操作しないこと、またその逆も避けること**です ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=%2F%2F%20MyNavBar,react%20components))。Reactに移行した部分のUI更新やイベント処理は全てReact側で完結させ、古いjQueryコードからは干渉しないようにします。必要に応じてReactコンポーネント内で`props`やコールバック関数を用意し、既存コードからそれらを呼び出すことで橋渡しすると良いでしょう。段階的移行では、一気に全てを書き換えようとせず、新規機能や改修箇所から優先してReact化し、十分にテストしながら徐々に範囲を広げます。こうすることでリスクを抑えつつモダンな実装へ移行できます。

## フロントエンド実装時の具体的注意点

### useEffectとAJAX（jQuery）呼び出しの統合
React Hooksを使用したコンポーネントでデータ取得（AJAXリクエスト）を行う場合、`useEffect`フック内でjQueryのAJAXを呼び出すことができます。ポイントは、副作用処理であるデータ取得は**コンポーネントの初回マウント時**または依存するステートが変化したタイミングで実行し、不要な再実行を避けることです。例えば以下のように、依存配列を指定して`useEffect`内で`$.ajax`を呼び出します（`axios`や`fetch`を使う場合も同様）:

```jsx
import { useEffect, useState } from 'react';
import $ from 'jquery';

function DataLoader({ itemId }) {
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let xhr = $.ajax({
      url: `/api/items/${itemId}`,
      method: 'GET',
      dataType: 'json',
      success: (data) => {
        setItem(data);       // AJAX結果をReactの状態に保存
      },
      error: (xhr, status, err) => {
        console.error('API error:', err);
        setError(err);
      }
    });
    // クリーンアップ: コンポーネントアンマウント時にXHRを中断
    return () => {
      if (xhr) xhr.abort();
    };
  }, [itemId]); // itemIdが変わったら再度実行、空配列[]なら初回のみ
  
  // ...JSXでitemやerrorの内容を表示...
}
```

上記のように`useEffect`内でjQueryの`$.ajax`を利用し、通信成功時に`setState`系関数で取得データをStateに保存します。**重要なのは、`useEffect`の依存配列**です。例えばID（`itemId`）が変わった時のみ再度データ取得するように指定し、無限ループで通信しないようにします。依存配列を空`[]`にすれば初回マウント時だけ実行できます。また、`useEffect`はクリーンアップ関数を返すことでコンポーネントのアンマウント時に処理を行えます。上記コードではXHRオブジェクトの`abort()`を呼び出し、コンポーネントが画面から消えた後に不要なコールバックが実行されたり、メモリリークしたりしないようにしています。Reactでは**副作用のクリーンアップ**が重要で、イベントリスナーやタイマー、XHRのような外部処理は必要に応じて後片付けを実装しましょう ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=Note%20that%20we%20defined%20both,registered%20to%20prevent%20memory%20leaks))。

なお、クラスコンポーネントで実装する場合は`componentDidMount`や`componentDidUpdate`でAJAXを開始し、`componentWillUnmount`で中断処理を行います。関数コンポーネント＋Hooksでは前述のとおり`useEffect`を使うことで同様の処理を実現します。

### AJAX結果とReact Stateの同期
AJAXで取得したデータは必ずReactのstateに保持し、UIはそのstateをもとに描画するようにします ([AJAX and APIs – React](https://legacy.reactjs.org/docs/faq-ajax.html#:~:text=Where%20in%20the%20component%20lifecycle,I%20make%20an%20AJAX%20call)) ([AJAX and APIs – React](https://legacy.reactjs.org/docs/faq-ajax.html#:~:text=componentDidMount%28%29%20%7B%20fetch%28,))。上記コード例でも`success`時に`setItem(data)`として`item`ステートを更新しています。こうすることで、取得データをReactが検知して再レンダリングし、UIに反映します。jQueryのAJAXコールバック内で直接DOMを書き換える（例えば取得したデータで`$('#element').text(...);`のように操作する）ことは避けましょう。直接DOMを操作するとReactがその変化を把握できず、後で別のstate更新により再レンダリングされた際に、その直接操作した内容が上書きされて消えてしまう可能性があります ([How to use jQuery with React the right way | by Raul T | Medium](https://medium.com/@raultelbisz/how-to-use-jquery-with-react-the-right-way-8e7db1a1b9b#:~:text=found%20the%20top%20answer%20on,That%E2%80%99s%20why%20if%20it%E2%80%99s%20possible))。従って、**データはstateに集約し、UIはReactの描画に任せる**というパターンを守ります。

また、AJAX呼び出し中であることを示すローディング状態や、エラー発生時のエラー状態も管理するとUXが向上します。例えば上記`useEffect`の例では、通信開始前に`isLoading`ステートを`true`に設定し、成功・失敗時に`false`に戻す実装を入れると良いでしょう。エラー内容は`setError`で保持し、UIでユーザーにエラーメッセージを表示します（例えば`{error && <div className="error">通信に失敗しました</div>}`のように条件付きレンダリング）。このようにStateを中心に据えてAJAXと同期させることで、**ビューとデータの一貫性**が保たれ、予期せぬ不整合やバグを防ぎます。

### ReactによるDOM制御とjQuery操作の分離
ReactとjQueryが混在する場合でも、可能な限りDOM操作はReactに担当させることが理想です。つまり、要素の追加・削除や表示・非表示の切り替え、イベントハンドリングはReactの仮想DOMと声明的UIによって行い、jQueryは既存のプラグインを動かす場合やどうしても必要な細かな操作に留めます。どうしてもjQueryでDOM操作をする場合は、**その操作対象がReactの管理外**であるか確認してください。例えばReactコンポーネント内でサードパーティのjQueryプラグインを使う場合、Reactの`ref`を利用して特定のDOMノードを取得し、そこに対してのみjQuery処理を適用します ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=Sometimes%20you%20need%20a%20jQuery,Use%20refs))。この際、React側ではそのDOMノードの中身を一切レンダリングしないようにする工夫も有効です。公式ドキュメントでも、Reactが管理しない空の`<div>`要素をレンダリングしておき、`componentDidMount`（関数コンポーネントなら`useEffect`）でその`<div>`に対してjQueryプラグインを適用し、`componentWillUnmount`でプラグインを破棄するパターンが紹介されています ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=To%20demonstrate%20this%2C%20let%E2%80%99s%20sketch,for%20a%20generic%20jQuery%20plugin)) ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=class%20SomePlugin%20extends%20React.Component%20,somePlugin%28%29%3B))。こうすることで、その`<div>`内部は完全にjQueryプラグインに委ね、Reactは中身を干渉しないため安全に共存できます。

**イベントリスナーの競合**にも注意が必要です。Reactは合成イベントシステム上でイベントを扱っており、たとえばReactの`onClick`とjQueryの`$(elem).click()`を二重に同じ要素にバインドすると予期せぬ動作を招く可能性があります。さらに、jQueryのイベントトリガー（例えば`$(elem).trigger('click')`）はReactの合成イベントを発火させません。jQueryは自前のイベント管理をしており、DOMネイティブイベントとは異なる仕組みのため、Reactがそれを捕捉できないのです ([Triggering events on real DOM nodes doesn't trigger synthetic events · Issue #3249 · facebook/react · GitHub](https://github.com/facebook/react/issues/3249#:~:text=bloodyowl%20%20%20commented%20,71))。そのため、同じ要素に対するイベント処理はどちらか一方に統一することをお勧めします。既存コードでどうしてもjQuery側で`$('document').on('event', selector, handler)`のようにグローバルにイベントを仕込んでいる場合は、Reactコンポーネントのライフサイクル（マウント時）でそれを設定し、アンマウント時に`off`で解除するようにして、Reactコンポーネントが消えた後にイベントハンドラが残らないようにします ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=Note%20that%20we%20defined%20both,registered%20to%20prevent%20memory%20leaks))。理想的にはReactコンポーネント内のUI要素はReactのイベントハンドラで処理し、jQuery側からは直接触れない設計にすることです。

最後に、メモリリークやパフォーマンスの観点でもDOM操作の分離は重要です。jQueryで動的に要素を追加したり書き換えたりすると、Reactが仮想DOMとの差分計算をする際に無駄な負荷がかかったり、あるいは前述のようにイベントが二重登録されたりする恐れがあります。常に**ReactがレンダリングするUI = 実際のDOM**となるよう心がけ、jQueryで裏からDOMを書き換えるようなことは極力避けましょう。

## jQueryとReactが混在する場合の注意点

ReactとjQueryを同一アプリで使う際の一般的なベストプラクティスや注意点を整理します。

- **DOMの競合を避ける:** 前述のとおり、React管理下のDOMに対しjQueryで操作を加えると、Reactの仮想DOMとの差異によって状態不整合が起きます ([How to use jQuery with React the right way | by Raul T | Medium](https://medium.com/@raultelbisz/how-to-use-jquery-with-react-the-right-way-8e7db1a1b9b#:~:text=found%20the%20top%20answer%20on,That%E2%80%99s%20why%20if%20it%E2%80%99s%20possible))。そのため、明確にDOMの担当領域を分離し、お互いの領域を侵食しないようにします。既存の画面に部分的にReactコンポーネントを差し込む場合、そのコンポーネントが配置されたコンテナ要素（例: `<div id="react-root">`）内部はReactが独占し、外側はjQueryが扱う、といった取り決めをします。

- **イベントハンドラの重複登録に注意:** 同じ要素にReactとjQuery双方でイベントハンドラを登録すると、イベントが二重に発火したり、片方で停止したイベントがもう片方でハンドリングされるなど予期せぬ挙動につながります。例えば、Reactコンポーネント内のボタンに`onClick`プロップとjQueryの`$('button').on('click', ...)`を両方設定すると混乱を招きます。どちらで処理するか決め、重複は避けます。また、jQuery側でイベント委譲を使っている場合は特に、React側で同じDOM構造を再生成するとイベントが外れてしまう可能性もあります。必要であればReactのイベント内でカスタムイベントを発行し（`new CustomEvent`など）、jQuery側でそれを検知するか、あるいはグローバルなイベントバスや状態管理経由で通信する方法も検討します。

- **プラグイン利用時の隔離:** DatePickerやグラフ描画など、既存のjQueryプラグインをReactコンポーネント内で使いたい場合は、そのプラグインが管理するDOM要素を極力Reactが触らないようにします。Reactの`ref`を使ってプラグイン用のDOMノードを取得し、`useEffect`内で`$(ref.current).pluginName(options)`のように初期化します。アンマウント時にプラグインが提供するdestroyメソッドやイベントハンドラの`unbind`/`off`を呼び、リソースリークを防ぎます ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=class%20SomePlugin%20extends%20React.Component%20,somePlugin%28%29%3B)) ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=Note%20that%20we%20defined%20both,registered%20to%20prevent%20memory%20leaks))。また、プラグインによってはReact対応版がある場合も多いので、長期的にはReact対応版や代替ライブラリへの置き換えも検討するとよいでしょう。

- **UIとデータの一貫性:** jQueryで取得したデータやユーザー入力はReactのstateに反映させ、可能ならその後のUI更新はReactに任せる形にリファクタリングします。例えば、従来jQueryでフォーム入力値を集めてAJAX送信していた処理は、Reactコンポーネント内でフォームを管理し、送信イベントでstateから値を取り出してAJAX（fetch）を呼ぶ、という風に改修します。徐々にでもこうした責務分離を進めることで、最終的にjQueryの役割を縮小し、React主導の開発に移行しやすくなります。

- **パフォーマンスへの配慮:** ReactとjQuery双方でDOMを操作すると、画面更新のたびに無駄な操作が増えパフォーマンスに悪影響です。例えばReactがせっかく差分レンダリングで効率化しても、jQueryがそのたびにDOM全体を再書き換えするようなことをしていては台無しです。基本はReactの仮想DOMによる部分更新を活かし、jQuery処理は必要最低限に限定します。また、React開発者ツール等でどのくらい再レンダリングが発生しているか、jQuery処理に無駄がないかをプロファイリングし、チューニングを行います。

以上の点を踏まえ、ReactとjQueryが混在するコードベースでは**明確な境界線を引き、通信やデータ処理はReact/JavaScriptに集約し、既存のjQueryロジックはラッピングして再利用する**ようなアプローチが望ましいです。

## バックエンド側の配慮点

### CORS（クロスオリジンリソース共有）への対応
フロントエンドのPWA（Chrome上で動作）とバックエンドAPI（Java + Spring）が**別ドメインもしくは別ポート**でホストされる場合、CORSの設定が必要です。ブラウザのセキュリティ制限により、スクリプトは同一オリジン（ドメイン・ポート・プロトコルが同じ）以外へのリクエストが制限されます。このため、バックエンドのSpring側で適切にCORSを許可しなければ、フロントからのAPI呼び出しがブロックされます。Springではコントローラーレベルで`@CrossOrigin`アノテーションを付与する方法が簡単です。例えば特定のコントローラーまたはメソッドに以下のように指定します:

```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "https://example.com")  // 許可するフロントエンドのオリジン
public class ApiController {

    @GetMapping("/items")
    public List<Item> getItems() { ... }

    @PostMapping("/items")
    public ResponseEntity<Item> createItem(@RequestBody Item item) { ... }

    // その他のハンドラ...
}
```

上記のように付与すると、そのクラス内の全ハンドラ、またはメソッド単位でCORSが有効になり、指定したオリジンからのアクセスが許可されます ([Getting Started | Enabling Cross Origin Requests for a RESTful Web Service](https://spring.io/guides/gs/rest-service-cors#:~:text=match%20at%20L411%20This%20,by%20specifying%20the%20value%20of))。引数で`origins`や`allowedHeaders`、`methods`などを細かく指定できます。`@CrossOrigin`を付けない場合、サーバーは`Access-Control-Allow-Origin`ヘッダーを返さないため、ブラウザは同オリジン以外からのリクエスト結果を受け取れずエラーになります。業務システムでは社内LAN上でフロントエンドとバックエンドが同一オリジンとなる場合も多いですが、例えばフロントがCDN配信されバックエンドがAPIサーバーとして別ホストの場合などは確実にCORS設定を行いましょう。なおSpring Securityを使っている場合、セキュリティフィルタでCORSを有効にする追加設定が必要なことにも注意してください（`.cors()`設定やフィルタでの許可）。

### @RequestBody と @RequestParam の使い分け（データ受け渡し方式）
SpringベースのAPIでは、クライアントから送られるデータが**リクエストボディ**に含まれるか、**クエリパラメータ/フォームデータ**として送られるかでハンドリングが異なります。React+jQueryからAJAXで送信する際に適切な形式でデータを送り、サーバー側でもそれに応じた受け取り方をすることが重要です。

- **JSONデータを送る場合:** 近年はREST APIでJSONをリクエストボディに載せることが一般的です。jQueryの`$.ajax`でJSONを送信するには、`contentType: 'application/json'`を指定し、`data`にJavaScriptオブジェクトではなく`JSON.stringify(...)`した文字列を渡します。例えば:
  ```js
  $.ajax({
    url: '/api/items',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ name: 'Item1', price: 100 }),
    success: ... 
  });
  ```
  Springのコントローラー側では、対応するエンドポイントでメソッド引数に`@RequestBody`を付けたオブジェクトを定義します。例えば:
  ```java
  @PostMapping("/items")
  public ResponseEntity<Item> createItem(@RequestBody Item item) {
      // 受け取ったitemオブジェクトを処理
      Item saved = service.save(item);
      return ResponseEntity.ok(saved);
  }
  ```
  これにより、リクエストボディのJSONが自動的に`Item`クラスのインスタンスにマッピングされます ([Difference between @RequestBody and @RequestParam](https://www.geeksforgeeks.org/difference-between-requestbody-and-requestparam/#:~:text=The%20%40RequestBody%20is%20used%20to,or%20JSON%20data%20to%20send))。@RequestBodyはHTTPリクエストボディ全体を対象とするため、JSON以外にもXMLやフォームデータもMappingJackson2HttpMessageConverter等があれば受け取れますが、典型的にはJSONシリアライズ/デシリアライズ用途です。

- **フォームデータ（クエリ文字列）を送る場合:** 古いjQueryのコードや単純なケースでは、デフォルトの`contentType: 'application/x-www-form-urlencoded; charset=UTF-8'`でキーと値のペアを送信しているかもしれません。その場合、Spring側では`@RequestParam`を使って個別の値を受け取るか、あるいはコマンドオブジェクトを用いて`@ModelAttribute`的に受け取ります ([Difference between @RequestBody and @RequestParam](https://www.geeksforgeeks.org/difference-between-requestbody-and-requestparam/#:~:text=In%20Spring%20Boot%2C%20the%20%40RequestBody,or%20passed%20as%20a%20query))。例えば:
  ```js
  // contentType指定なしで$.ajaxにオブジェクトを渡す
  $.ajax({
    url: '/api/items',
    method: 'POST',
    data: { name: 'Item1', price: 100 },
    // contentType未指定の場合、jQueryはフォームエンコードで送信
    ...
  });
  ```
  サーバー側コントローラ:
  ```java
  @PostMapping("/items")
  public ResponseEntity<Item> createItem(@RequestParam String name, @RequestParam int price) {
      // nameとpriceをそれぞれ受け取る
      Item saved = service.save(new Item(name, price));
      return ResponseEntity.ok(saved);
  }
  ```
  このようにすると、フォームフィールドとして送られた`name`と`price`を個別のメソッド引数として取得できます。クエリパラメータの場合も同様に`@RequestParam`で取得します。なお、複数フィールドがある場合にいちいち引数が増えるのが煩雑であれば、`ItemForm`のようなDTOクラスを作り、それを引数に取ってSpringにバインドさせる方法もあります（その場合クラスにデフォルトコンストラクタとプロパティのsetterが必要）。いずれにせよ、**送信側と受信側でデータ形式を揃える**ことが大切です。

既存APIがどの形式を期待しているかを確認し、新規に実装するAPIも含めて統一したスタイルで設計します。新規開発では基本的にJSONをリクエスト/レスポンスに用いるRESTfulな設計が望ましいです。その際、SpringではデフォルトでJacksonライブラリによるJSONシリアライズが有効になっているため、`@RequestBody`や`@ResponseBody`を適切に使うことでスムーズにやりとりできます。

### バリデーションとエラーレスポンス設計
バックエンドでは、リクエストに対する**入力バリデーション**と、エラー発生時の**レスポンスフォーマット**を統一して設計することが重要です。まず入力バリデーションについては、SpringのBean Validation（JSR 380）を活用できます。DTOクラスのフィールドに`@NotNull`, `@Size`, `@Pattern`などのアノテーションを付与し、コントローラーメソッドで`@Valid @RequestBody`とすることで、自動的にリクエストJSONの検証が行われます。例えば:
```java
public class ItemForm {
    @NotBlank
    private String name;
    @Min(0)
    private int price;
    // getter, setter略
}

@PostMapping("/items")
public ResponseEntity<?> createItem(@Valid @RequestBody ItemForm form, BindingResult result) {
    if (result.hasErrors()) {
        // バリデーション失敗時
        List<String> errors = result.getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .collect(Collectors.toList());
        Map<String, Object> errorBody = Map.of(
            "status", HttpStatus.BAD_REQUEST.value(),
            "errors", errors
        );
        return ResponseEntity.badRequest().body(errorBody);
    }
    // バリデーション成功時の処理...
}
```
上記のように実装すると、必須項目不足や形式不正のリクエストに対し、HTTP 400ステータスとともにエラー内容をJSONで返すことができます。フロントエンドではこのエラーレスポンスを受け取り、ユーザーにフィードバックを表示します。エラーレスポンスのフォーマットは統一しておくと処理がシンプルになります。例えば、常に`{ status: 400, errors: [ "name: 必須項目です", ... ] }`のようなJSON構造で返すようにすれば、フロント側でステータスコードとメッセージを汎用処理しやすくなります。業務アプリではフィールド単位のエラーをユーザーにハイライト表示することも多いので、`errors`配列ではなく`fieldErrors: {field: message, ...}`のマップにするなど、ニーズに合わせて設計します。

また、サーバー側の例外ハンドリングも重要です。想定外の例外についてはグローバルな例外ハンドラ（`@ControllerAdvice`＋`@ExceptionHandler`）を実装し、スタックトレース入りのHTMLではなくJSONでエラー情報を返すようにします。例えば500エラー時には`{ status: 500, error: "Internal Server Error", message: "..."} `のような汎用エラーJSONを返すようにするなど、バックエンドのエラー出力を統一します。こうすることでPWAフロントエンド側でエラー処理を一括して行え、ユーザーにも一貫したエラー表示が可能となります。

### API設計のベストプラクティスとセキュリティ
バックエンドAPIはRESTfulな設計を心がけ、リソース指向のエンドポイントを定義します（例：`GET /api/items`で一覧取得、`POST /api/items`で新規作成など）。HTTPメソッドの意味に沿った使い方をし、適切なステータスコードを返すようにします。例えば更新成功時は200(OK)または204(No Content)、作成成功時は201(Created)と`Location`ヘッダー、認可エラーは403(Forbidden)などです。フロントエンドのjQuery AJAX側でも`success`や`error`ハンドラ内でこれらステータスに応じた処理を実装します。

セキュリティ面では、認証が必要なAPIについてはSpring Securityで認可チェックを入れ、認証情報はセッションクッキーやAuthorizationヘッダーで渡します。Chrome限定のPWAであれば最新のSameSite=Noneクッキーも利用可能なので、セッション方式の場合は`SameSite=None; Secure`属性を付けてクッキーがクロスサイトでも送信されるようにし、`$.ajax`側で`xhrFields: { withCredentials: true }`とすることでセッションを維持できます。JWTなどを使う場合はローカルストレージに保存しがちですが、XSSリスクを踏まえ、可能ならHTTPOnlyクッキーに乗せるか、どうしてもJSで扱う場合はしっかりとXSS対策（CSPポリシーの設定や入力エスケープ）を行います。

バックエンドとフロントエンドは**契約（Contract）**を結んでいると捉え、APIの入出力仕様（JSONのキーや型、意味）をドキュメント化し、両者で齟齬がないようにします。変更があればバージョン管理や互換性維持を検討し、段階的にデプロイ/アップデートする戦略を取ります。

## PWA固有の注意点（HTTPS・Service Worker・キャッシュ戦略・オフライン対応）

業務用PWAとして求められるオフライン対応やキャッシュ戦略について、いくつか重要なポイントとベストプラクティスを解説します。

### HTTPSの必須利用
繰り返しになりますが、PWAでは**HTTPSが必須**です。サービスワーカーはセキュアな環境でのみ動作し、Chromeを含むモダンブラウザはHTTPSで提供されていないサイトにはサービスワーカーの登録すら許可しません ([Using Service Workers - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#:~:text=Service%20workers%20are%20enabled%20by,origin%20by%20browsers%20as%20well))。したがって、本番環境ではTLS証明書を正しく設定し、`https://`でホストします。社内システムの場合でも社内認証局の証明書を配布するか、ローカルにインストールしてもらう形で信頼されたHTTPS通信路を確保します。HTTPSは通信内容の暗号化だけでなく、**内容の改ざん防止**という意味でも重要です。サービスワーカーのスクリプト自体が改ざんされるリスクを避けるため、HTTPS上でホストすることが要求されます ([Service Worker API - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API#:~:text=Service%20workers%20only%20run%20over,to%20malicious%20code%20injection))。開発時は`localhost`が例外として許可されますが、IPアドレス直指定やホスト名でのHTTPは動かないので注意してください。

### Service Workerの設計とキャッシュ戦略
サービスワーカーはPWAの核となる技術で、**オフライン時の動作**や**ネットワーク制御**を可能にします ([Making PWAs work offline with Service workers - Progressive web apps | MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers#:~:text=Service%20Workers%20are%20a%20virtual,the%20user%27s%20device%20is%20offline))。Service Workerの主な役割は、ネットワークとアプリの間のプロキシとしてリクエストを intercept し、適切にキャッシュを利用したレスポンスを返すことです ([Making PWAs work offline with Service workers - Progressive web apps | MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers#:~:text=Service%20workers%20can%20do%20more,cache%2C%20or%20synthesize%20responses%20completely))。業務アプリにおけるサービスワーカー設計では、次のような点を検討します。

- **サービスワーカーの登録:** Reactアプリの場合、`create-react-app`でプロジェクトを作成するとデフォルトでサービスワーカー（Workbox）が組み込まれるオプションもありますが、手動で実装する場合は`navigator.serviceWorker.register('/sw.js')`のようにして登録します ([Making PWAs work offline with Service workers - Progressive web apps | MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers#:~:text=if%20%28,examples%2Fjs13kpwa%2Fsw.js%22%29%3B))。登録はアプリ起動時に一度行えば、以降はバックグラウンドでSWが動作します。バージョンアップ時の挙動（`install`→`activate`イベントで古いキャッシュをクリアするなど ([Making PWAs work offline with Service workers - Progressive web apps | MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers#:~:text=Lifecycle%20of%20a%20Service%20Worker))）も考慮し、必要なら`self.skipWaiting()`や`clients.claim()`をSW内で呼び、新バージョンへの切り替えタイミングを制御します。

- **キャッシュすべきリソースの選定:** 業務用アプリでは比較的頻繁に変わるデータと、そうでないデータがあります。**アプリケーションシェル**（HTMLやCSS、JavaScript、ロゴ画像等）は基本的にバージョンが変わるまで内容が不変なので、SWの`install`イベント時に事前キャッシュ（precache）すると良いでしょう。これは「オフラインファースト」戦略にもつながり、アプリ起動時にネットワークがなくても基本画面が表示できます ([Using Service Workers - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#:~:text=Service%20workers%20fix%20these%20issues,often%20chosen%20over%20web%20apps))。一方、APIから取得する業務データ（商品一覧や在庫情報など）は変化するため、キャッシュ有効期限や更新タイミングの戦略が必要です。一般的なキャッシュ戦略としては:
  - **ネットワークファースト**: 常にネットワークから最新を取得し、失敗したらキャッシュから提供する。最新性が重要なデータ（在庫数やリアルタイム性の高い情報）に適しています。
  - **キャッシュファースト（フォールバック）**: まずキャッシュから返し、古い場合はバックグラウンドでネットワーク取得して更新する（stale-while-revalidateパターン）か、ネットワーク失敗時のみ取得する。ユーザーの操作待ち画面など即座に応答すべきデータに有用です。業務アプリではスピード重視の場合に検討します。
  - **高速化目的の静的キャッシュ**: ライブラリのJS、CSS、フォント、アイコンなどは長期間キャッシュし、`SW`更新時にインバリデートするようにします。
  
  具体的には、Service Worker内で`self.addEventListener('fetch', event => { ... })`を実装し、`event.request`の種類に応じて`event.respondWith(...)`で適切なレスポンスを返します ([Offline and background operation - Progressive web apps | MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation#:~:text=Then%20whenever%20the%20app%20requests,worker%20can%20intercept%20the%20request))。例として、APIへのリクエストの場合:
  ```js
  self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);
    if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
      // APIリクエストの場合の戦略: ネットワーク優先
      event.respondWith(
        fetch(req).then(res => {
          // 成功したらレスポンスをクローンしてキャッシュにも保存
          const resClone = res.clone();
          caches.open('api-cache').then(cache => cache.put(req, resClone));
          return res;
        }).catch(err => {
          // オフラインなどで失敗した場合キャッシュから返す
          return caches.match(req);
        })
      );
      return;
    }
    // 他のリクエスト(静的リソースなど)はデフォルト処理 or 別戦略
    // ...
  });
  ```
  上記は簡略化した例ですが、`fetch`イベントでAPIパスへのリクエストを捕まえ、ネットワーク取得成功時にキャッシュし、失敗時にはキャッシュから返す実装です。静的アセットに対してはキャッシュ優先で、存在しなければネットワーク取得する処理を別途書けます。なお、こうした低レベル実装を自前で行う代わりに、**Workbox**ライブラリを使うと宣言的に戦略を定義できます。Workboxでは`registerRoute()`でURLパターンとキャッシュ戦略（NetworkFirst, CacheFirst, StaleWhileRevalidateなど）を指定するだけで実装可能で、細かいバグも少なくおすすめです。

- **キャッシュの管理と更新:** キャッシュしたデータにはバージョンを付け、古いキャッシュは適切なタイミングで削除します ([Handling POST Requests in Offline Mode | by Sakshi Sehgal | Medium](https://sehgalsakshi.medium.com/handling-post-requests-in-offline-mode-4bea8fcd398#:~:text=Here%20instead%20of%20getting%20service,Fetch%20Event))。例えば`precache`したアセット群には`cacheName`にバージョンを入れて(`myapp-static-v1`など)、サービスワーカーの`activate`イベントで古いバージョン（`v0`など）のキャッシュを一括削除します ([Handling POST Requests in Offline Mode | by Sakshi Sehgal | Medium](https://sehgalsakshi.medium.com/handling-post-requests-in-offline-mode-4bea8fcd398#:~:text=1,too%2C%20we%E2%80%99ll%20use%20a%20separate))。APIキャッシュについてもデータの特性に応じて有効期限を決め、`fetch`時にキャッシュのタイムスタンプを確認して古ければ無視する、といった実装も考えられます。業務データは整合性が重要なので、キャッシュが原因で誤った古い情報を表示し続けないように注意します。

### オフライン時のPOSTリクエスト処理
オフライン対応で難易度が高いのが、**データ更新系（POST/PUT/DELETE）のリクエスト**です。HTTPの世界ではGETリクエストは基本的に**安全で副作用がなく**（データを取得するだけなので何度繰り返し呼んでも同じ結果になる）、ブラウザのキャッシュAPIもGETレスポンスをキャッシュ対象としています ([Handling POST Requests in Offline Mode | by Sakshi Sehgal | Medium](https://sehgalsakshi.medium.com/handling-post-requests-in-offline-mode-4bea8fcd398#:~:text=Now%20the%20catch%20here%20is%2C,a%20primary%20key%20in%20case))。一方、POSTなどの書き込みリクエストはサーバー側の状態を変更するため、繰り返し実行すればその分だけ重複作業が行われてしまいます。そのため単純に「POSTのレスポンスをCache Storageに保存しておいてオフライン時に返す」ということはできません（規格上、Cache APIはPOSTリクエストをキーとしたキャッシュを持てますが、実質的に活用が難しいです）。ではオフライン中のデータ送信要求をどう扱うかですが、基本方針は**「キャッシュする」のではなく「キューに蓄積して後で送信する」**になります ([Handling POST Requests in Offline Mode | by Sakshi Sehgal | Medium](https://sehgalsakshi.medium.com/handling-post-requests-in-offline-mode-4bea8fcd398#:~:text=With%20great%20problems%2C%20comes%20innovative,Mind%20you%2C%20handling%20not%20caching))。

具体的な実現方法としては、**Background Sync API**の利用が挙げられます。Background Syncを使うと、ネットワークが復旧したタイミングでサービスワーカーに`sync`イベントが飛び、そこでキューに溜めておいたリクエストを再試行できます ([workbox-background-sync  |  Modules  |  Chrome for Developers](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync#:~:text=The%20new%20BackgroundSync%20API%20is,method%20of%20retrying%20failed%20requests))。Chromeは標準で対応しており、例えば以下のような流れになります:
1. オフライン中にユーザーがデータ更新（POST）を行うと、サービスワーカーの`fetch`イベントでそれを捕捉します。
2. サービスワーカー側で失敗したリクエストの内容（URL、メソッド、ボディ）をIndexedDBなどに保存しておき、`event.respondWith()`ではユーザーに即座に「オフラインのため送信保留」のようなレスポンスを返すか、もしくは楽観的UI更新を行った後で空レスポンスを返します。
3. サービスワーカーで`self.registration.sync.register('sync-tag')`を呼び出し、バックグラウンド同期をスケジュールします。
4. ネットワークが戻りブラウザが同期イベントを発火すると、サービスワーカーの`sync`イベントリスナー内でIndexedDBから保留中リクエストを取り出し、実際に`fetch`でサーバーに送信します。成功したらキューから削除し、失敗なら後で再同期（ブラウザが適切に再試行してくれます）。

コード上はWorkboxを使うと簡潔に実装でき、Workboxの`BackgroundSyncPlugin`は失敗したリクエストを自動でキューイングし、次回オンライン時に再送してくれます ([workbox-background-sync  |  Modules  |  Chrome for Developers](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync#:~:text=The%20easiest%20way%20to%20use,events%20are%20fired)) ([workbox-background-sync  |  Modules  |  Chrome for Developers](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync#:~:text=maxRetentionTime%3A%2024%20,specified%20in%20minutes%29))。例えばWorkboxで`registerRoute()`にPOSTエンドポイントと`NetworkOnly`戦略＋BackgroundSyncPluginを設定しておけば、オフライン発生時に自動キューイングされます。

Background Syncが使えない場合（Safariなど未対応ブラウザ、またはシステム要件で使用不可の場合）は、**手動でリトライ機構**を実装します。オフライン検知には`navigator.onLine`や`window.addEventListener('online', ...)`でオンライン復帰を捕捉できます。オフライン中のリクエストは上述のとおりIndexedDB等に保存し、オンライン復帰イベントでスクリプトが起動しているなら順次送信します。ブラウザが閉じている間の復帰は検知できないため、この点Background Syncはブラウザ依存で自動実行される分優れています ([workbox-background-sync  |  Modules  |  Chrome for Developers](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync#:~:text=The%20new%20BackgroundSync%20API%20is,method%20of%20retrying%20failed%20requests))。

いずれにせよ、オフラインでのPOST処理では**ユーザーへの通知**も大切です。例えば「現在オフラインのため、送信内容はキューに保存されました。オンライン復帰後に自動送信します。」といったメッセージを表示してユーザーを安心させる必要があります。送信完了後に通知や画面更新をすることも考慮します。業務アプリの場合、同一データに対する競合（オフライン中にAとBがそれぞれ編集し両方後で送信したらどうマージするか等）の問題もありますが、それは業務ルール次第なので、サーバー側でタイムスタンプやバージョンを持たせて競合検知・解決するなどの実装が必要になるでしょう。

### その他のPWA要件
PWAとしての最低要件である**Web App Manifestの用意**も忘れずに行います。マニフェストファイル(`manifest.json`)を作成し、アプリアイコン、名前（short_nameとname）、テーマカラー、起動URL、表示モード（`standalone`など）を設定します。これによりユーザーがアプリをホーム画面にインストールでき、起動時にアドレスバーのないアプリ風の表示になります。Chrome限定であればマニフェストへの対応は良好なので、社内配布でもインストール手順を周知すればスムーズに利用してもらえるでしょう。

最後に、PWAでは**常に最新バージョンに保つ仕組み**にも気を配ります。サービスワーカー経由でキャッシュした資産が更新されず古いままだとバグ修正や機能追加が反映されません。適切にキャッシュを無効化（ファイル名にハッシュをつける、SW更新時に`skipWaiting()`で即時反映する等）し、ユーザーが常に最新を得られるようにします。業務用の場合、アップデートの通知や強制リロードの仕組み（SWが新バージョンを検知したらユーザーに「新しいバージョンがあります。更新しますか？」と確認し、OKなら`clients.claim()`で制御を乗っ取ってページリロードする等）を組み込むことも検討できます。

以上、React + jQuery併用によるPWA構築のポイントを**フロントエンド（React HooksとjQueryの統合、DOM操作の分離、イベント管理）**と**バックエンド（SpringによるAPI設計、CORS対応、データ受け渡しとバリデーション）**、そして**PWA固有の要件（HTTPS、サービスワーカーとキャッシュ戦略、オフライン時の処理）**の観点から詳細に解説しました。これらベストプラクティスに沿って実装を進めれば、既存資産を活かしつつモダンで信頼性の高い業務用PWAを構築できるでしょう。

 ([How to use jQuery with React the right way | by Raul T | Medium](https://medium.com/@raultelbisz/how-to-use-jquery-with-react-the-right-way-8e7db1a1b9b#:~:text=found%20the%20top%20answer%20on,That%E2%80%99s%20why%20if%20it%E2%80%99s%20possible)) ([javascript - What is the right way to use Jquery in React? - Stack Overflow](https://stackoverflow.com/questions/51304288/what-is-the-right-way-to-use-jquery-in-react#:~:text=%2F%2F%20MyNavBar,react%20components)) ([AJAX and APIs – React](https://legacy.reactjs.org/docs/faq-ajax.html#:~:text=Where%20in%20the%20component%20lifecycle,I%20make%20an%20AJAX%20call)) ([AJAX and APIs – React](https://legacy.reactjs.org/docs/faq-ajax.html#:~:text=componentDidMount%28%29%20%7B%20fetch%28,)) ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=class%20SomePlugin%20extends%20React.Component%20,somePlugin%28%29%3B)) ([Integrating with Other Libraries – React](https://legacy.reactjs.org/docs/integrating-with-other-libraries.html#:~:text=Note%20that%20we%20defined%20both,registered%20to%20prevent%20memory%20leaks)) ([Triggering events on real DOM nodes doesn't trigger synthetic events · Issue #3249 · facebook/react · GitHub](https://github.com/facebook/react/issues/3249#:~:text=bloodyowl%20%20%20commented%20,71)) ([Getting Started | Enabling Cross Origin Requests for a RESTful Web Service](https://spring.io/guides/gs/rest-service-cors#:~:text=match%20at%20L411%20This%20,by%20specifying%20the%20value%20of)) ([Difference between @RequestBody and @RequestParam](https://www.geeksforgeeks.org/difference-between-requestbody-and-requestparam/#:~:text=The%20%40RequestBody%20is%20used%20to,or%20JSON%20data%20to%20send)) ([Difference between @RequestBody and @RequestParam](https://www.geeksforgeeks.org/difference-between-requestbody-and-requestparam/#:~:text=In%20Spring%20Boot%2C%20the%20%40RequestBody,or%20passed%20as%20a%20query)) ([Using Service Workers - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#:~:text=Service%20workers%20are%20enabled%20by,origin%20by%20browsers%20as%20well)) ([Handling POST Requests in Offline Mode | by Sakshi Sehgal | Medium](https://sehgalsakshi.medium.com/handling-post-requests-in-offline-mode-4bea8fcd398#:~:text=Now%20the%20catch%20here%20is%2C,a%20primary%20key%20in%20case)) ([workbox-background-sync  |  Modules  |  Chrome for Developers](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync#:~:text=The%20new%20BackgroundSync%20API%20is,method%20of%20retrying%20failed%20requests)) ([workbox-background-sync  |  Modules  |  Chrome for Developers](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync#:~:text=The%20easiest%20way%20to%20use,events%20are%20fired))