import { useState } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import styled from "styled-components";

const GifPickerContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 320px;
  height: 400px;
  .giphy-grid {
    overflow-y: auto;
    height: calc(100% - 60px);
  }
`;

interface GifPickerProps {
  isOpen: boolean;
  onGifSelect: (gifUrl: string) => void;
  onClose: () => void;
}

// Initialize the GIPHY client
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY!);

export function GifPicker({ isOpen, onGifSelect, onClose }: GifPickerProps) {
  const [gifSearchQuery, setGifSearchQuery] = useState("");

  if (!isOpen) return null;

  return (
    <GifPickerContainer onClick={(e) => e.stopPropagation()}>
      <div className="p-2">
        <input
          type="text"
          className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg"
          placeholder="Search GIFs..."
          value={gifSearchQuery}
          onChange={(e) => setGifSearchQuery(e.target.value)}
        />
      </div>
      <Grid
        key={gifSearchQuery}
        onGifClick={(gif) => {
          onGifSelect(` ${gif.images.fixed_height.url} `);
          onClose();
        }}
        noLink={true}
        hideAttribution={true}
        fetchGifs={() =>
          gifSearchQuery
            ? gf.search(gifSearchQuery, { limit: 10 })
            : gf.trending({ limit: 10 })
        }
        width={300}
        columns={2}
        gutter={6}
      />
    </GifPickerContainer>
  );
}
