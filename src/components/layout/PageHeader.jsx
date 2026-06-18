export default function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <div className="page-header">
      <div className="page-header__info">
        {breadcrumb && (
          <p className="page-header__breadcrumb">{breadcrumb}</p>
        )}
        <h1 className="page-header__title">{title}</h1>
        {description && (
          <p className="page-header__description">{description}</p>
        )}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
