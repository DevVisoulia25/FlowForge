import React from 'react';
import { Check, Clock, CircleDot, UserCheck } from 'lucide-react';

const StageStepper = ({ stages = [], orderHistory = [], currentStageId }) => {
  return (
    <div className="w-full py-4">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-2">
        {stages.map((stage, idx) => {
          // Find matching history item
          const historyItem = orderHistory.find(
            (h) => String(h.stageId) === String(stage._id)
          );

          const isCurrent = String(stage._id) === String(currentStageId?._id || currentStageId);
          const isCompleted = historyItem?.completedAt;

          return (
            <div
              key={stage._id}
              className="flex-1 flex flex-col md:items-center relative z-10 w-full"
            >
              {/* Connector line for horizontal view */}
              {idx < stages.length - 1 && (
                <div className="hidden md:block absolute top-5 left-1/2 w-full h-0.5 bg-slate-800 -z-10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-transparent'
                    }`}
                  ></div>
                </div>
              )}

              {/* Icon Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <CircleDot className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Stage Text Details */}
              <div className="mt-2 md:text-center">
                <p
                  className={`text-xs font-bold ${
                    isCurrent ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {stage.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {stage.departmentId?.name || 'Department'}
                </p>

                {historyItem?.completedAt && (
                  <div className="mt-1 text-[10px] text-slate-400 flex items-center md:justify-center space-x-1">
                    <UserCheck className="w-3 h-3 text-emerald-500" />
                    <span>{historyItem.completedByName || 'Dept User'}</span>
                  </div>
                )}

                {historyItem?.completedAt && (
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {new Date(historyItem.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageStepper;
