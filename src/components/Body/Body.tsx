import React, { useState } from 'react';
import ResultList from './ResultList';
import SearchBar from './SearchBar';

const dummyData = Array.from({ length: 30 }, (_, i) => {
  const fruits = ['リンゴ', 'バナナ', 'ぶどう', 'みかん', 'もも', 'すいか'];
  const colors = ['赤', '黄', '緑', '紫', '橙', 'ピンク'];
  const types = ['果物', '野菜'];
  const origins = ['日本産', 'アメリカ産', 'フィリピン産', '中国産'];

  const item = [
    fruits[i % fruits.length],
    colors[i % colors.length],
    types[i % types.length],
    origins[i % origins.length]
  ];
  return item.join(',');
});



const Body: React.FC = () => {
  const [filteredItems, setFilteredItems] = useState<string[]>([]);

  const handleSearch = (keyword: string) => {
    const results = dummyData.filter((item) =>
      item.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredItems(results);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <SearchBar onSearch={handleSearch} />
      <div style={{ padding: '8px', fontWeight: 'bold', color: 'green' }}>
        リスト画面表示中（検索前）
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <ResultList items={filteredItems} />
      </div>
    </div>
  );
  
  
};

export default Body;
