import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../styles/admin.css";

// Every admin page (except login) is placed inside this layout.
// "children" is whatever we write between <AdminLayout> and </AdminLayout>.
function AdminLayout({ activeItem, children }) {
  return (
    <div className="adm-page">
      <AdminSidebar activeItem={activeItem} />

      <main className="adm-main">
        <AdminTopbar />
        <div className="adm-content">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;