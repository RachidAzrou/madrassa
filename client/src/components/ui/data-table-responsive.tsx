import React, { ReactNode } from 'react';

interface CardListItemProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function CardListItem({ label, value, className = "" }: CardListItemProps) {
  return (
    <div className={`flex justify-between py-2 border-b border-gray-100 ${className}`}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

interface CardListProps {
  children: ReactNode;
  className?: string;
}

export function CardList({ children, className = "" }: CardListProps) {
  return (
    <div className={`bg-white rounded-md border border-gray-200 shadow-sm p-3 mb-3 ${className}`}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  item: any;
  fields: {
    key: string;
    label: string;
    render?: (value: any) => ReactNode;
  }[];
  actions?: ReactNode;
  className?: string;
}

export function MobileCard({ item, fields, actions, className = "" }: MobileCardProps) {
  return (
    <CardList className={className}>
      {fields.map((field) => (
        <CardListItem 
          key={field.key}
          label={field.label}
          value={field.render ? field.render(item[field.key]) : item[field.key]}
        />
      ))}
      
      {actions && (
        <div className="flex justify-end mt-3 pt-2 gap-2">
          {actions}
        </div>
      )}
    </CardList>
  );
}

interface ResponsiveTableProps {
  data: any[];
  columns: {
    key: string;
    header: string;
    render?: (value: any, item: any) => ReactNode;
    hideOnMobile?: boolean;
    mobileRender?: (value: any, item: any) => ReactNode;
  }[];
  renderActions?: (item: any) => ReactNode;
  isLoading?: boolean;
  emptyState?: ReactNode;
  className?: string;
  mobileFields?: {
    key: string;
    label: string;
    render?: (value: any) => ReactNode;
  }[];
}

export function ResponsiveTable({ 
  data, 
  columns, 
  renderActions,
  isLoading = false,
  emptyState,
  className = "",
  mobileFields
}: ResponsiveTableProps) {
  // Voor mobiel gebruiken we de mobileFields of leiden deze af van columns
  const fieldsForMobile = mobileFields || columns
    .filter(col => !col.hideOnMobile)
    .map(col => ({
      key: col.key,
      label: col.header,
      render: col.mobileRender ? col.mobileRender : 
             (col.render ? (value: any) => {
               // We moeten een versie van render gebruiken die maar één parameter verwacht
               const item = data.find(dataItem => dataItem[col.key] === value);
               return col.render!(value, item);
             } : undefined)
    }));

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-[#1e40af] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        {emptyState || (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm font-medium">Geen resultaten gevonden</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop versie - normale tabel */}
      <div className="hidden md:block overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  scope="col" 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {renderActions && (
                <th scope="col" className="relative px-4 py-3">
                  <span className="sr-only">Acties</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {renderActions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobiele versie - kaarten */}
      <div className="md:hidden">
        {data.map((item, index) => (
          <MobileCard 
            key={index} 
            item={item} 
            fields={fieldsForMobile}
            actions={renderActions ? renderActions(item) : undefined}
          />
        ))}
      </div>
    </div>
  );
}