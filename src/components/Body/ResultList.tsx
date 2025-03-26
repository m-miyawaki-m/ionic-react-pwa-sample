import React from 'react';
import './ResultList.css';

type Props = {
  items: string[];
};

const ResultList: React.FC<Props> = ({ items }) => {
  return (
    <div className="result-list-container">
      <table className="result-table">
        <thead>
          <tr>
            <th>項目1</th>
            <th>項目2</th>
            <th>項目3</th>
            <th>項目4</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const values = item.split(',');
            return (
              <tr key={index}>
                <td>{values[0]}</td>
                <td>{values[1]}</td>
                <td>{values[2]}</td>
                <td>{values[3]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResultList;
