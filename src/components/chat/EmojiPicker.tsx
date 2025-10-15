import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

type EmojiObject = {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
};

interface EmojiPickerProps {
  isOpen: boolean;
  onEmojiSelect: (emoji: EmojiObject) => void;
  onClose: () => void;
}

export function EmojiPicker({ isOpen, onEmojiSelect, onClose }: EmojiPickerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg"
      onClick={(e) => e.stopPropagation()}
      data-emoji-picker="true"
      style={{ backgroundColor: "white" }}
    >
      <Picker
        data={data}
        previewPosition="none"
        theme="light"
        onEmojiSelect={(emoji: EmojiObject) => {
          onEmojiSelect(emoji);
          onClose();
        }}
      />
    </div>
  );
}
