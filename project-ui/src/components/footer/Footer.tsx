import { GlassPanel } from "../glass";

export default function Footer() {
  return (
    <GlassPanel
      intensity="subtle"
      className="text-text-primary"
      contentClassName="flex items-center justify-center p-4"
      glassProps={{ borderRadius: 0 }}
    >
      <p className="text-sm glass-text">&copy; {new Date().getFullYear()} Eduardo Duarte. All rights reserved.</p>
    </GlassPanel>
  );
}
