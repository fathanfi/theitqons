-- Create a view for calculating student points
CREATE OR REPLACE VIEW student_total_points AS
WITH point_sums AS (
  SELECT 
    sp.student_id,
    COALESCE(SUM(p.point), 0) as earned_points
  FROM students s
  LEFT JOIN student_points sp ON s.id = sp.student_id
  LEFT JOIN points p ON sp.point_id = p.id
  GROUP BY sp.student_id
),
redemption_sums AS (
  SELECT
    student_id,
    COALESCE(SUM(points), 0) as redeemed_points
  FROM redemptions
  GROUP BY student_id
)
SELECT
  s.id as student_id,
  s.name as student_name,
  COALESCE(ps.earned_points, 0) as earned_points,
  COALESCE(rs.redeemed_points, 0) as redeemed_points,
  COALESCE(ps.earned_points, 0) - COALESCE(rs.redeemed_points, 0) as total_points
FROM students s
LEFT JOIN point_sums ps ON s.id = ps.student_id
LEFT JOIN redemption_sums rs ON s.id = rs.student_id;