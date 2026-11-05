import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import AdminLayout from "../../Admin/AdminLayout";
import { getAdminReviews } from "../../../api/admin";

function AdminReviews() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminReviews()
      .then((reviews) => {
        if (active) setData(reviews);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout activeItem="Reviews">
      <h1 className="adm-title">Customer Reviews</h1>
      <p className="adm-subtitle">Customer feedback submitted for completed roadside service requests.</p>

      <section className="adm-card adm-box">
        <div className="adm-box-head">
          <h2><Star size={18} /> Platform Average Rating</h2>
          {!loading && !error && (
            <span className="adm-badge grey">
              {data?.stats?.averageRating ?? 0} ★ · {data?.stats?.totalReviews ?? 0} reviews
            </span>
          )}
        </div>

        {loading ? (
          <p>Loading customer reviews...</p>
        ) : error ? (
          <p className="adm-error" role="alert">{error}</p>
        ) : data?.reviews?.length ? (
          data.reviews.map((review) => {
            const serviceRequest = review.serviceRequestId;
            const serviceDate = serviceRequest?.completedAt || serviceRequest?.createdAt;

            return (
              <article key={review._id} className="adm-review-box">
                <div className="adm-review-top">
                  <strong>{review.mechanicId?.fullName || "Mechanic"}</strong>
                  <span className="adm-stars" aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}
                  </span>
                </div>
                <p>"{review.comment}"</p>
                <small>
                  <span>
                    Customer: {review.customerId?.fullName || "Customer"} · Service: {serviceRequest?.problem || "Service request"}
                    {serviceRequest?.vehicle?.model ? ` · ${serviceRequest.vehicle.model}` : ""}
                  </span>
                  <time dateTime={review.createdAt}>
                    Review: {new Date(review.createdAt).toLocaleString()}
                    {serviceDate ? ` · Service: ${new Date(serviceDate).toLocaleDateString()}` : ""}
                  </time>
                </small>
              </article>
            );
          })
        ) : (
          <p>No customer reviews have been submitted yet.</p>
        )}
      </section>
    </AdminLayout>
  );
}

export default AdminReviews;
