interface LabCanvasProps {
  children: React.ReactNode;
}

export default function LabCanvas({ children }: LabCanvasProps) {
  return (
    <div className="w-screen h-screen flex items-center justify-center overflow-hidden">
      <div className="w-[700px] h-[450px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
