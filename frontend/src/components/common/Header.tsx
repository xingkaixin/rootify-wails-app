interface HeaderProps {
  version: string;
}

export function Header({ version }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="relative inline-block">
        <h1 className="text-2xl font-bold text-gray-900">金融词根翻译系统</h1>
        <span className="absolute bottom-0 right-0 text-sm text-gray-500 transform translate-x-full ml-2">
          v{version}
        </span>
      </div>
    </header>
  );
}