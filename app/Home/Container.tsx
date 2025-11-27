export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto px-4 max-w-[1260px]">
      {children}
    </div>
  );
}
