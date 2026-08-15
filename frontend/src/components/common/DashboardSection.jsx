import React from 'react';

const DashboardSection = ({
  title,
  subtitle,
  action,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-2xs text-slate-500 mt-0.5 font-semibold">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

export default DashboardSection;
