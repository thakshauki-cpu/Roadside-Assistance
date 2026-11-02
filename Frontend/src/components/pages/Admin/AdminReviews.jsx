import { Star } from "lucide-react";
import AdminLayout from "../../Admin/AdminLayout";
import { customerReviews } from "../../Admin/adminSampleData";

function AdminReviews() {
  return (
    <AdminLayout activeItem="Reviews">
      <h1 className="adm-title">Customer Reviews</h1>
      <p className="adm-subtitle">Latest feedback from customers about roadside mechanics. (Simple version, no Figma frame yet.)</p>

      <section className="adm-card adm-box">
        <div className="adm-box-head">
          <h2><Star size={18} /> Average Rating</h2>
          <span className="adm-badge grey">4.85 ★</span>
        </div>

        {customerReviews.map((review) => (
          <div key={review.id} className="adm-review-box">
            <div className="adm-review-top">
              <strong>{review.mechanic}</strong>
              <span className="adm-stars">{"★".repeat(review.stars)}</span>
            </div>
            <p>"{review.text}"</p>
            <small>
              — {review.by} <span>{review.time}</span>
            </small>
          </div>
        ))}
      </section>
    </AdminLayout>
  );
}

export default AdminReviews;