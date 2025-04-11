const GroupList = ({
  messageGroups,
  selectedGroup,
  onSelectGroup,
  onCreateGroup,
}) => {
  return (
    <div className="w-1/4 bg-white border-r border-gray-300 overflow-y-auto">
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-xl font-semibold">Messages</h2>
        <button
          onClick={onCreateGroup}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add group
        </button>
      </div>
      <div>
        {messageGroups.map((group) => (
          <div
            key={group.id}
            className={`p-4 border-b border-gray-200 cursor-pointer ${
              selectedGroup === group.id ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
            onClick={() => onSelectGroup(group.id)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{group.name}</span>
              {group.unread > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {group.unread}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupList;
