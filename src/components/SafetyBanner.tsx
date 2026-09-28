import React from 'react';
import { AlertTriangle, ShieldCheck, Flame, Zap } from 'lucide-react';

interface SafetyBannerProps {
  isCritical?: boolean;
  reason?: string;
  onAcknowledge?: () => void;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({
  isCritical = false,
  reason,
  onAcknowledge,
}) => {
  if (isCritical) {
    return (
      <div className="bg-rose-950/80 border-2 border-rose-600/80 rounded-xl p-4 text-rose-100 shadow-xl shadow-rose-950/50 mb-4 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-900 rounded-lg text-rose-200 flex-shrink-0 mt-0.5">
              <Flame className="h-6 w-6 text-rose-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider bg-rose-800 text-rose-100 px-2 py-0.5 rounded">
                  Critical Hazard Interlock Active
                </span>
                <span className="text-xs text-rose-300">Lockout/Tagout (LOTO) Required</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Immediate Physical Isolation Required
              </h4>
              <p className="text-xs text-rose-200 leading-relaxed">
                {reason || 'A hazardous electrical, thermal, or mechanical risk was detected in this report.'}
              </p>
              <div className="text-[11px] font-mono text-rose-300 bg-rose-900/60 p-2 rounded mt-2 border border-rose-700/60">
                1. Engage Emergency Stop (E-Stop).
                2. De-energize primary breaker.
                3. Do NOT open electrical panels or perform unassisted DIY maintenance.
                4. Contact licensed OEM certified field engineers.
              </div>
            </div>
          </div>

          {onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="text-xs font-mono bg-rose-800 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg border border-rose-600 cursor-pointer"
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-300 flex items-center justify-between text-xs">
      <div className="flex items-center space-x-2 text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>
          <strong className="text-slate-300">Notice:</strong> AI-assisted troubleshooting guidance. For hazardous electrical or pressurized conditions, contact qualified personnel.
        </span>
      </div>
      <span className="hidden sm:inline-block text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
        OSHA &amp; LOTO Compliant
      </span>
    </div>
  );
};
