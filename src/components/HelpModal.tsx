import { useEffect, useRef } from "react";

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function HelpModal({ open, onClose }: HelpModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="modal-topline"><span>도움말</span><span className="status-dot" aria-hidden="true" /></div>
        <h2 id="help-title">막힌 곳은 화면으로 보여 주세요</h2>
        <p>무엇을 만들지보다 지금 보이는 화면과 원하는 한 가지를 알려 주면 됩니다. 한 번에 한 가지씩 다시 말해 보세요.</p>
        <div className="help-steps">
          <div><strong>01</strong><span>현재 화면을 캡처합니다.</span></div>
          <div><strong>02</strong><span>“이 부분이 막혔어요”라고 적습니다.</span></div>
          <div><strong>03</strong><span>바꿀 한 가지를 정해 확인합니다.</span></div>
        </div>
        <button ref={closeButtonRef} type="button" className="button button-dark" onClick={onClose}>확인했어요</button>
      </section>
    </div>
  );
}
