import { IonButton, IonSearchbar } from '@ionic/react';
import React, { useState } from 'react';
import './SearchBar.css'; // スタイルを分離してもOK

type Props = {
  onSearch: (value: string) => void;
};

const SearchBar: React.FC<Props> = ({ onSearch }) => {
  const [input, setInput] = useState('');

  return (
    <div className="searchbar-container">
      <IonSearchbar
        value={input}
        onIonChange={(e) => setInput(e.detail.value!)}
        placeholder="検索キーワードを入力"
      />
      <IonButton onClick={() => onSearch(input)}>検索</IonButton>
    </div>
  );
};

export default SearchBar;
