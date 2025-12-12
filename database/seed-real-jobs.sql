-- Insert realistic job positions for CS60 system
-- Based on common job postings in Da Nang, Vietnam

-- Insert more job positions
INSERT INTO job_positions (title, department, description, requirements, is_active, created_by, company_id) VALUES
-- IT Jobs
('Lập Trình Viên Frontend ReactJS', 'IT', 'Phát triển giao diện web bằng ReactJS, Tailwind CSS. Làm việc với team Backend để tích hợp API. Tham gia các dự án outsourcing cho thị trường Nhật Bản.', 'Kinh nghiệm 1-2 năm React/Vue.js. Biết HTML5, CSS3, JavaScript ES6+. Am hiểu Responsive Design. Tiếng Anh đọc hiểu tài liệu.', TRUE, 26, 1),

('Backend Developer Node.js', 'IT', 'Xây dựng RESTful API với Node.js, Express. Thiết kế database MySQL/MongoDB. Tối ưu performance và bảo mật hệ thống.', 'Kinh nghiệm 2+ năm Node.js. Thành thạo Express, Sequelize/Mongoose. Hiểu biết về MySQL, Redis. Có kinh nghiệm với Docker, CI/CD là lợi thế.', TRUE, 26, 1),

('Full Stack Developer (MERN)', 'IT', 'Phát triển ứng dụng web full-stack sử dụng MERN Stack. Thiết kế UI/UX. Deploy và maintain production systems.', 'Kinh nghiệm 2-3 năm MERN Stack. Thành thạo MongoDB, Express, React, Node.js. Biết TypeScript, Next.js là lợi thế. Có khả năng làm việc độc lập.', TRUE, 26, 2),

('Mobile Developer React Native', 'IT', 'Phát triển ứng dụng di động cross-platform với React Native. Tích hợp các API native. Optimize app performance.', 'Kinh nghiệm 1+ năm React Native. Thành thạo JavaScript/TypeScript. Đã publish app lên App Store/Google Play. Biết native iOS/Android code là lợi thế.', TRUE, 26, 2),

('DevOps Engineer', 'IT', 'Quản lý infrastructure trên AWS/GCP. Setup CI/CD pipelines. Monitor và optimize system performance. Implement security best practices.', 'Kinh nghiệm 2+ năm DevOps. Thành thạo Docker, Kubernetes, Jenkins. Có kinh nghiệm với AWS/GCP, Terraform. Biết Linux administration.', TRUE, 26, 1),

('Data Engineer', 'IT', 'Xây dựng data pipeline. ETL processes. Thiết kế data warehouse. Tối ưu query performance.', 'Kinh nghiệm 2+ năm Data Engineering. Thành thạo SQL, Python. Có kinh nghiệm với Spark, Airflow, Kafka. Biết về Data Modeling.', TRUE, 26, 2),

('QA/QC Engineer', 'IT', 'Thực hiện testing cho web/mobile apps. Viết test cases, automation tests. Report bugs và verify fixes.', 'Kinh nghiệm 1+ năm QA/QC. Biết Selenium, Postman, JMeter. Có kinh nghiệm với automation testing. Tỉ mỉ, chi tiết trong công việc.', TRUE, 26, 1),

('UI/UX Designer', 'Design', 'Thiết kế giao diện web/mobile app. Nghiên cứu user experience. Tạo prototype và wireframe. Làm việc với team Development.', 'Kinh nghiệm 2+ năm UI/UX. Thành thạo Figma, Adobe XD, Photoshop. Có portfolio design ấn tượng. Hiểu biết về Design System, Material Design.', TRUE, 26, 1),

-- Marketing Jobs
('Digital Marketing Executive', 'Marketing', 'Lập kế hoạch và thực hiện các chiến dịch marketing online. Quản lý Facebook Ads, Google Ads. Phân tích data và tối ưu ROI.', 'Kinh nghiệm 1-2 năm Digital Marketing. Thành thạo Facebook Ads, Google Ads. Biết SEO, content marketing. Có khả năng phân tích data và báo cáo.', TRUE, 26, 2),

('Content Marketing Specialist', 'Marketing', 'Sáng tạo nội dung cho website, blog, social media. Viết bài PR, content SEO. Phát triển content strategy.', 'Kinh nghiệm 1+ năm Content Marketing. Kỹ năng viết tốt, sáng tạo. Biết SEO on-page. Am hiểu về social media marketing. Có portfolio viết bài.', TRUE, 26, 2),

('SEO Specialist', 'Marketing', 'Tối ưu website cho search engines. Nghiên cứu keywords. Xây dựng backlinks. Phân tích và báo cáo SEO performance.', 'Kinh nghiệm 1-2 năm SEO. Thành thạo Google Analytics, Search Console. Biết SEO on-page và off-page. Có case study SEO thành công.', TRUE, 26, 1),

-- Business Jobs  
('Business Analyst', 'Business', 'Phân tích yêu cầu nghiệp vụ. Viết tài liệu đặc tả. Bridge giữa khách hàng và technical team. Đảm bảo sản phẩm đáp ứng yêu cầu.', 'Kinh nghiệm 2+ năm BA. Thành thạo SQL, Excel. Có kỹ năng phân tích và tư duy logic tốt. Biết Agile/Scrum. Tiếng Anh giao tiếp tốt.', TRUE, 26, 1),

('Project Manager', 'PMO', 'Quản lý dự án phần mềm. Lập kế hoạch và phân bổ nguồn lực. Theo dõi tiến độ và báo cáo. Đảm bảo dự án hoàn thành đúng thời gian.', 'Kinh nghiệm 3+ năm PM. Có chứng chỉ PMP/Scrum Master là lợi thế. Kỹ năng leadership và giao tiếp tốt. Có kinh nghiệm quản lý team 5-10 người.', TRUE, 26, 1),

('Sales Executive', 'Sales', 'Tìm kiếm và chăm sóc khách hàng. Tư vấn giải pháp IT. Đàm phán và ký hợp đồng. Đạt chỉ tiêu doanh thu được giao.', 'Kinh nghiệm 1+ năm Sales, ưu tiên B2B. Kỹ năng giao tiếp và thuyết phục tốt. Ham học hỏi, năng động. Có mạng lưới khách hàng là lợi thế.', TRUE, 26, 2),

-- HR & Admin
('HR Executive', 'HR', 'Tuyển dụng nhân sự IT. Quản lý hồ sơ nhân viên. Xây dựng văn hóa công ty. Tổ chức các hoạt động team building.', 'Kinh nghiệm 1-2 năm HR. Kỹ năng tuyển dụng IT là lợi thế. Giao tiếp tốt, năng động. Biết sử dụng các công cụ tuyển dụng online.', TRUE, 26, 1),

('Nhân Viên Hành Chính', 'Admin', 'Quản lý văn phòng phẩm, tài sản công ty. Hỗ trợ các công việc hành chính. Đặt vé, booking phòng họp. Tiếp đón khách.', 'Tốt nghiệp Đại học chuyên ngành liên quan. Kỹ năng tin học văn phòng tốt. Cẩn thận, tỉ mỉ. Có kinh nghiệm là lợi thế.', TRUE, 26, 2),

-- Internship
('Thực Tập Sinh Lập Trình', 'IT', 'Học tập và làm việc với các senior developers. Tham gia các dự án thực tế. Được đào tạo về quy trình phát triển phần mềm chuyên nghiệp.', 'Sinh viên năm 3, 4 ngành CNTT. Có kiến thức về HTML, CSS, JavaScript hoặc Java, Python. Nhiệt huyết, ham học hỏi. Có thể full-time 3-6 tháng.', TRUE, 26, 1),

('Thực Tập Sinh Digital Marketing', 'Marketing', 'Hỗ trợ team marketing trong các chiến dịch. Học cách chạy quảng cáo Facebook, Google. Viết content cho social media.', 'Sinh viên năm 3, 4 ngành Marketing, Truyền thông. Biết sử dụng Canva, Photoshop cơ bản. Có khả năng viết content. Nhiệt huyết với Marketing.', TRUE, 26, 2),

-- Specialized Jobs
('Chuyên Viên Bảo Mật', 'Security', 'Đánh giá và cải thiện bảo mật hệ thống. Penetration testing. Xử lý sự cố bảo mật. Đào tạo về security awareness.', 'Kinh nghiệm 2+ năm Security. Có chứng chỉ CEH, OSCP là lợi thế. Hiểu biết về OWASP Top 10, network security. Có khả năng phân tích và giải quyết vấn đề.', TRUE, 26, 1),

('AI/ML Engineer', 'AI', 'Phát triển các mô hình Machine Learning. Training và optimize models. Deploy ML models to production. Research và apply các thuật toán mới.', 'Kinh nghiệm 2+ năm ML/AI. Thành thạo Python, TensorFlow/PyTorch. Có kinh nghiệm với Computer Vision hoặc NLP. Có paper/project về AI là lợi thế.', TRUE, 26, 2),

('Blockchain Developer', 'Blockchain', 'Phát triển smart contracts. Build DApps trên Ethereum/Solana. Nghiên cứu và apply blockchain technology vào các sản phẩm.', 'Kinh nghiệm 1+ năm Blockchain. Thành thạo Solidity, Web3.js. Có kinh nghiệm develop smart contract. Hiểu biết về DeFi, NFT.', TRUE, 26, 1);

-- Update existing jobs with more realistic descriptions
UPDATE job_positions 
SET description = 'Xây dựng và phát triển hệ thống backend cho các ứng dụng web. Thiết kế RESTful API, tối ưu database queries, xử lý logic nghiệp vụ phức tạp.',
    requirements = 'Kinh nghiệm 2+ năm Node.js/Express. Thành thạo MySQL, Redis. Hiểu về microservices, message queue. Biết Docker, AWS là lợi thế.'
WHERE position_id = 2;

UPDATE job_positions 
SET description = 'Phát triển full-stack cho các sản phẩm web. Xây dựng UI/UX với React, API với Node.js, quản lý database. Deploy và maintain production systems.',
    requirements = 'Kinh nghiệm 2-3 năm MERN Stack. Thành thạo MongoDB, Express, React, Node.js. Có khả năng làm việc độc lập và teamwork tốt.'
WHERE position_id = 3;

COMMIT;
