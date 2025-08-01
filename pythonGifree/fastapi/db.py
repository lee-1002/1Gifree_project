import mariadb
import pandas as pd
import datetime
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

print("DB 연결 시작")

# 데이터베이스 연결 정보 (환경 변수에서 로드)
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "192.168.0.69"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "gifreeuser3"),
    "password": os.getenv("DB_PASSWORD", "gifreeuser3"),
    "database": os.getenv("DB_NAME", "real_db"),
    "local_infile": True
}

def get_connection():
    """데이터베이스 연결 객체를 반환하는 공통 함수"""
    try:
        # DB_CONFIG 정보를 사용하여 DB에 연결하고 그 연결 객체를 반환합니다.
        conn = mariadb.connect(**DB_CONFIG)
        return conn
    except mariadb.Error as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return None

def test_connection():
    """데이터베이스 연결 테스트"""
    try:
        conn = mariadb.connect(**DB_CONFIG)
        print("✅ 데이터베이스 연결 성공!")
        conn.close()
        return True
    except mariadb.Error as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return False

def load_csv_with_infile(csv_file, table, create_table_sql=None):
    """CSV 파일을 데이터베이스에 로드"""
    conn = None
    cur = None
    
    try:
        # 데이터베이스 연결
        conn = mariadb.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # CSV 파일 읽기
        df = pd.read_csv(csv_file, encoding='cp949', delimiter='\t')
        print("DataFrame 정보:")
        print(df.head())
        print(f"컬럼: {list(df.columns)}")
        print(f"행 수: {len(df)}")
        
        # 테이블 생성 (필요한 경우)
        if create_table_sql:
            try:
                cur.execute(f"DROP TABLE IF EXISTS {table}")
                cur.execute(create_table_sql)
                print(f"✅ 테이블 {table} 생성 완료")
            except mariadb.Error as e:
                print(f"⚠️ 테이블 생성 중 오류: {e}")
        
        # 동적으로 INSERT 문 생성
        column_names = ', '.join([f'`{col}`' for col in df.columns])  # 백틱으로 컬럼명 감싸기
        placeholders = ', '.join(['?' for _ in df.columns])
        insert_sql = f"INSERT INTO {table} ({column_names}) VALUES ({placeholders})"
        
        print(f"실행할 SQL: {insert_sql}")
        
        # 데이터 삽입
        success_count = 0
        for index, row in df.iterrows():
            try:
                # NaN 값을 None으로 변환
                row_data = [None if pd.isna(x) else x for x in row]
                cur.execute(insert_sql, tuple(row_data))
                success_count += 1
            except mariadb.Error as e:
                print(f"❌ {index+1}번째 행 삽입 실패: {e}")
                print(f"데이터: {tuple(row)}")
        
        conn.commit()
        print(f"✅ 데이터 삽입 완료! (성공: {success_count}/{len(df)})")
        
    except mariadb.Error as e:
        print(f"❌ 데이터베이스 오류: {e}")
    except FileNotFoundError:
        print(f"❌ CSV 파일을 찾을 수 없습니다: {csv_file}")
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
            
def get_all_brands():
    """tbl_product에서 중복을 제외한 모든 브랜드 이름을 가져옵니다."""
    # 1. 위에서 만든 공통 함수로 DB 연결을 시도합니다.
    conn = get_connection()
    # 2. 만약 연결에 실패하면 빈 리스트를 반환하고 함수를 종료합니다.
    if not conn:
        return []
    
    try:
        query = "SELECT DISTINCT brand_name FROM tbl_product"
        df = pd.read_sql(query, conn)
        return df['brand_name'].tolist()
    except Exception as e:
        print(f"브랜드 목록 조회 중 오류 발생: {e}")
        return []
    finally:
        # 3. 작업이 끝나면 연결을 반드시 닫아줍니다.
        if conn:
            conn.close()

def show_data(table):
    """데이터베이스에서 데이터 조회 후 DataFrame으로 반환"""
    conn = None
    cur = None
    
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cur = conn.cursor()

        # 데이터 조회
        cur.execute(f"SELECT * FROM {table}")
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        
        print(f"조회된 행 수: {len(rows)}")
        print(f"컬럼: {columns}")
        
        if not rows:
            print("조회된 데이터가 없습니다.")
            return pd.DataFrame()
        
        # 데이터 처리
        processed_data = []
        
        for i, row in enumerate(rows):
            processed_row = []
            
            for j, value in enumerate(row):
                # datetime 객체 처리
                if isinstance(value, (datetime.date, datetime.datetime)):
                    processed_row.append(value.strftime("%Y-%m-%d"))
                # None 값 처리
                elif value is None:
                    processed_row.append(None)
                else:
                    processed_row.append(value)
            
            processed_data.append(processed_row)
        
        # DataFrame 생성
        df = pd.DataFrame(processed_data, columns=columns)
        print(f"✅ {table} 테이블 데이터 조회 완료 (행 수: {len(df)})")
        print(df)
        
        return df

    except mariadb.Error as e:
        print(f"❌ 데이터 조회 실패: {e}")
        return None
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def create_sample_table():
    """샘플 테이블 생성"""
    create_sql = """
    CREATE TABLE IF NOT EXISTS stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2),
        volume INT,
        market_cap BIGINT,
        sector VARCHAR(50),
        industry VARCHAR(100),
        listing_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    return create_sql

def show_tables():
    """모든 테이블 목록 조회"""
    conn = None
    cur = None
    
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute("SHOW TABLES")
        tables = cur.fetchall()
        
        print("=== 데이터베이스 테이블 목록 ===")
        for table in tables:
            print(f"- {table[0]}")
            
    except mariadb.Error as e:
        print(f"❌ 테이블 조회 실패: {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def describe_table(table_name):
    """테이블 구조 조회"""
    conn = None
    cur = None
    
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute(f"DESCRIBE {table_name}")
        structure = cur.fetchall()
        
        print(f"=== {table_name} 테이블 구조 ===")
        for field in structure:
            print(f"컬럼: {field[0]}, 타입: {field[1]}, NULL: {field[2]}, 키: {field[3]}, 기본값: {field[4]}")
            
    except mariadb.Error as e:
        print(f"❌ 테이블 구조 조회 실패: {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def search_db():
    """지정된 데이터베이스의 테이블 목록을 반환"""
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("SHOW TABLES;")
        tables = [table[0] for table in cursor.fetchall()]

        print(f"✅ 데이터베이스 '{DB_CONFIG['database']}'의 테이블 목록:")
        for table in tables:
            print(" -", table)

        cursor.close()
        conn.close()

        return tables
    except mariadb.Error as e:
        print(f"❌ 오류 발생: {e}")
        return []
        
def get_donation_summary():
    """사용자별 기부 요약 정보를 MariaDB에서 조회합니다."""
    conn = None
    try:
        # MariaDB에 연결
        conn = mariadb.connect(**DB_CONFIG) # **DB_CONFIG로 한번에 전달
        
        query = """
     SELECT
    dp.email AS '기부자 이메일', 
    COUNT(dp.dno) AS '총기부횟수',
    SUM(dp.amount) AS '총기부금액' 
FROM
    tbl_donation_product dp
GROUP BY
    dp.email
ORDER BY
    총기부횟수 DESC, 총기부금액 DESC;
"""
        df = pd.read_sql(query, conn)
        print(f"✅ 기부 데이터 조회 완료: {len(df)}명의 기부자")
        if not df.empty:
            print("상위 5명 기부자:")
            print(df.head().to_string())
        return df
    except mariadb.Error as e:
        print(f"❌ 데이터 조회 실패: {e}")
        return pd.DataFrame() # 에러 발생 시 빈 데이터프레임 반환
    finally:
        if conn:
            conn.close()

def get_products_by_brand_sorted(brand_name):
    """특정 브랜드의 상품들을 가격순으로 정렬하여 반환"""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        
        # 먼저 테이블 구조 확인
        cursor = conn.cursor()
        cursor.execute("DESCRIBE tbl_product")
        columns = cursor.fetchall()
        print("테이블 구조:", [col[0] for col in columns])
        
        # 실제 컬럼명에 맞는 쿼리 사용
        query = """
        SELECT pno, brand, pname, price, sale_price, pdesc, del_flag
        FROM tbl_product 
        WHERE brand = %s AND del_flag = false
        ORDER BY COALESCE(sale_price, price) ASC
        """
        
        df = pd.read_sql(query, conn, params=[brand_name])
        
        # NaN 값을 None으로 변환
        df = df.where(pd.notnull(df), None)
        
        print(f"✅ {brand_name} 브랜드 상품 {len(df)}개 조회 완료")
        return df
        
    except mariadb.Error as e:
        print(f"❌ 브랜드별 상품 조회 실패: {e}")
        return pd.DataFrame()
    finally:
        if conn:
            conn.close()

def check_starbucks_products():
    """스타벅스 상품 데이터 확인"""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        
        query = """
        SELECT pno, brand, pname, price, pdesc, delFlag
        FROM tbl_product 
        WHERE brand LIKE '%스타벅스%' OR brand LIKE '%starbucks%'
        ORDER BY price ASC
        """
        
        df = pd.read_sql(query, conn)
        print(f"✅ 스타벅스 상품 {len(df)}개 발견:")
        if not df.empty:
            print(df[['pname', 'price']].to_string())
        else:
            print("스타벅스 상품이 없습니다.")
        return df
        
    except mariadb.Error as e:
        print(f"❌ 스타벅스 상품 조회 실패: {e}")
        return pd.DataFrame()
    finally:
        if conn:
            conn.close()

def get_products_sorted(limit=10, sort_by='price'):
    """전체 상품을 정렬하여 조회"""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        
        if sort_by == '가격순' or sort_by == '가장 싼':
            order_clause = "ORDER BY COALESCE(sale_price, price) ASC"
        elif sort_by == '인기순':
            order_clause = "ORDER BY pno DESC"  # 최신순으로 대체
        else:
            order_clause = "ORDER BY COALESCE(sale_price, price) ASC"
        
        query = f"""
        SELECT pno, brand, pname, price, sale_price, pdesc, del_flag
        FROM tbl_product 
        WHERE del_flag = false
        {order_clause}
        LIMIT %s
        """
        
        df = pd.read_sql(query, conn, params=[limit])
        
        # NaN 값을 None으로 변환
        df = df.where(pd.notnull(df), None)
        
        print(f"✅ 전체 상품 {len(df)}개 조회 완료 (정렬: {sort_by})")
        return df
        
    except mariadb.Error as e:
        print(f"❌ 전체 상품 조회 실패: {e}")
        return pd.DataFrame()
    finally:
        if conn:
            conn.close()

def clear_all_donation_data():
    """모든 기부 데이터를 삭제합니다."""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 기부 상품 테이블 비우기
        cursor.execute("DELETE FROM tbl_donation_product")
        donation_deleted = cursor.rowcount
        
        # 기부 관련 회원도 삭제 (선택사항)
        cursor.execute("""
            DELETE FROM member 
            WHERE email IN (
                SELECT DISTINCT email 
                FROM tbl_donation_product
            )
        """)
        member_deleted = cursor.rowcount
        
        conn.commit()
        print(f"✅ 기부 데이터 삭제 완료!")
        print(f"   - 기부 기록: {donation_deleted}개 삭제")
        print(f"   - 관련 회원: {member_deleted}개 삭제")
        
        return True
        
    except mariadb.Error as e:
        print(f"❌ 데이터 삭제 실패: {e}")
        return False
    finally:
        if conn:
            conn.close()

def check_donation_data():
    """기부 데이터 확인 함수"""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 기부 상품 테이블 확인
        cursor.execute("SELECT COUNT(*) FROM tbl_donation_product")
        donation_count = cursor.fetchone()[0]
        print(f"📊 총 기부 기록: {donation_count}개")
        
        if donation_count > 0:
            # 최근 기부 기록 확인
            cursor.execute("""
                SELECT dp.dno, dp.amount, dp.count, m.email, dp.created_at
                FROM tbl_donation_product dp
                JOIN member m ON dp.email = m.email
                ORDER BY dp.created_at DESC
                LIMIT 5
            """)
            recent_donations = cursor.fetchall()
            print("📋 최근 기부 기록:")
            for donation in recent_donations:
                print(f"  - 기부번호: {donation[0]}, 금액: {donation[1]}원, 횟수: {donation[2]}, 기부자: {donation[3]}, 시간: {donation[4]}")
        
        # 회원 테이블 확인
        cursor.execute("SELECT COUNT(*) FROM member")
        member_count = cursor.fetchone()[0]
        print(f"👥 총 회원 수: {member_count}명")
        
        return donation_count > 0
        
    except mariadb.Error as e:
        print(f"❌ 데이터 확인 실패: {e}")
        return False
    finally:
        if conn:
            conn.close()

def create_test_donation_data():
    """테스트용 기부 데이터 생성"""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 먼저 회원이 있는지 확인
        cursor.execute("SELECT email FROM member LIMIT 1")
        members = cursor.fetchall()
        
        if not members:
            print("❌ 회원 데이터가 없습니다. 먼저 회원을 생성해주세요.")
            return False
        
        # 기부용 상품이 있는지 확인하고 없으면 생성
        cursor.execute("SELECT pno FROM tbl_product WHERE pname = '기부' AND brand = '기부'")
        donation_product = cursor.fetchone()
        
        if not donation_product:
            # 기부용 상품 생성
            cursor.execute("""
                INSERT INTO tbl_product (pname, brand, price, pdesc, del_flag) 
                VALUES ('기부', '기부', 0, '기부 전용 상품', false)
            """)
            conn.commit()
            cursor.execute("SELECT LAST_INSERT_ID()")
            donation_product_id = cursor.fetchone()[0]
            print(f"✅ 기부용 상품 생성: {donation_product_id}")
        else:
            donation_product_id = donation_product[0]
            print(f"✅ 기존 기부용 상품 사용: {donation_product_id}")
        
        # 테스트 기부 데이터 생성
        test_donations = [
            (members[0][0], 10000, 1),  # 첫 번째 회원, 1만원, 1회
            (members[0][0], 5000, 1),   # 첫 번째 회원, 5천원, 1회
            (members[0][0], 3000, 1),   # 첫 번째 회원, 3천원, 1회
        ]
        
        for email, amount, count in test_donations:
            cursor.execute("""
                INSERT INTO tbl_donation_product (pno, email, amount, count, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (donation_product_id, email, amount, count))
        
        conn.commit()
        print("✅ 테스트 기부 데이터 생성 완료")
        return True
        
    except mariadb.Error as e:
        print(f"❌ 테스트 데이터 생성 실패: {e}")
        return False
    finally:
        if conn:
            conn.close()

def check_actual_donation_data():
    """실제 기부 데이터를 확인합니다."""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 1. tbl_donation_product 테이블의 모든 데이터 확인
        cursor.execute("""
            SELECT dno, amount, count, created_at, email, pno
            FROM tbl_donation_product
            ORDER BY created_at DESC
        """)
        donations = cursor.fetchall()
        print(f"📊 tbl_donation_product 테이블 데이터:")
        print(f"총 {len(donations)}개의 기부 기록")
        for donation in donations:
            print(f"  - 기부번호: {donation[0]}, 금액: {donation[1]}원, 횟수: {donation[2]}, 시간: {donation[3]}, 이메일: {donation[4]}, 상품번호: {donation[5]}")
        
        # 2. member 테이블 확인
        cursor.execute("SELECT email, nickname FROM member")
        members = cursor.fetchall()
        print(f"👥 member 테이블 데이터:")
        print(f"총 {len(members)}명의 회원")
        for member in members:
            print(f"  - 이메일: {member[0]}, 닉네임: {member[1]}")
        
        # 3. JOIN 테스트
        cursor.execute("""
            SELECT dp.dno, dp.amount, dp.count, dp.email, m.email as member_email
            FROM tbl_donation_product dp
            LEFT JOIN member m ON dp.email = m.email
            ORDER BY dp.created_at DESC
        """)
        joined_data = cursor.fetchall()
        print(f"🔗 JOIN 결과:")
        for data in joined_data:
            print(f"  - 기부번호: {data[0]}, 금액: {data[1]}원, 기부자이메일: {data[3]}, 회원이메일: {data[4]}")
        
        return len(donations)
        
    except mariadb.Error as e:
        print(f"❌ 데이터 확인 실패: {e}")
        return 0
    finally:
        if conn:
            conn.close()

def create_donation_dummy_data():
    """기부 더미 데이터를 생성합니다."""
    conn = None
    try:
        conn = mariadb.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 먼저 회원이 있는지 확인
        cursor.execute("SELECT email FROM member LIMIT 10")
        members = cursor.fetchall()
        
        if not members:
            print("❌ 회원 데이터가 없습니다. 먼저 회원을 생성해주세요.")
            return False
        
        # 기부용 상품이 있는지 확인하고 없으면 생성
        cursor.execute("SELECT pno FROM tbl_product WHERE pname = '기부' AND brand = '기부'")
        donation_product = cursor.fetchone()
        
        if not donation_product:
            # 기부용 상품 생성
            cursor.execute("""
                INSERT INTO tbl_product (pname, brand, price, pdesc, del_flag) 
                VALUES ('기부', '기부', 0, '기부 전용 상품', false)
            """)
            conn.commit()
            cursor.execute("SELECT LAST_INSERT_ID()")
            donation_product_id = cursor.fetchone()[0]
            print(f"✅ 기부용 상품 생성: {donation_product_id}")
        else:
            donation_product_id = donation_product[0]
            print(f"✅ 기존 기부용 상품 사용: {donation_product_id}")
        
        # 더미 기부 데이터 생성 (10명의 다양한 기부자 - 사실적인 데이터)
        dummy_donations = [
            # (이메일, 금액, 횟수, 브랜드, 상품명)
            ("kim@test.com", 85000, 1, "스타벅스", "아메리카노"),
            ("lee@test.com", 45000, 2, "교촌치킨", "허니콤보"),
            ("park@test.com", 120000, 3, "올리브영", "화장품세트"),
            ("choi@test.com", 65000, 1, "배스킨라빈스", "아이스크림"),
            ("jung@test.com", 35000, 2, "스타벅스", "카페라떼"),
            ("yoon@test.com", 55000, 1, "교촌치킨", "레드콤보"),
            ("han@test.com", 95000, 4, "올리브영", "스킨케어세트"),
            ("lim@test.com", 75000, 1, "배스킨라빈스", "파인트아이스크림"),
            ("kang@test.com", 40000, 2, "스타벅스", "카푸치노"),
            ("song@test.com", 12000, 3, "교촌치킨", "골드콤보"),  # 마지막 유저: 3회 기부, 15000원 미만
        ]
        
        # 먼저 더미 회원들을 생성
        korean_names = ["김철수", "이영희", "박민수", "최지영", "정현우", "윤서연", "한동현", "임수진", "강태호", "송미영"]
        for i, (email, amount, count, brand, pname) in enumerate(dummy_donations):
            # 회원이 없으면 생성
            cursor.execute("SELECT email FROM member WHERE email = %s", (email,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO member (email, nickname, password, role_set) 
                    VALUES (%s, %s, %s, %s)
                """, (email, korean_names[i], "password123", "USER"))
                print(f"✅ 회원 생성: {email} ({korean_names[i]})")
        
        conn.commit()
        
        # 기부 데이터 생성
        success_count = 0
        for email, amount, count, brand, pname in dummy_donations:
            try:
                cursor.execute("""
                    INSERT INTO tbl_donation_product (pno, email, amount, count, created_at, user_brand, user_pname)
                    VALUES (%s, %s, %s, %s, NOW(), %s, %s)
                """, (donation_product_id, email, amount, count, brand, pname))
                success_count += 1
                print(f"✅ 기부 데이터 생성: {email} - {brand} {pname} {amount}원")
            except mariadb.Error as e:
                print(f"❌ 기부 데이터 생성 실패 ({email}): {e}")
        
        conn.commit()
        print(f"✅ 더미 기부 데이터 생성 완료! (성공: {success_count}/{len(dummy_donations)})")
        return True
        
    except mariadb.Error as e:
        print(f"❌ 더미 데이터 생성 실패: {e}")
        return False
    finally:
        if conn:
            conn.close()

# 메인 실행 부분
if __name__ == '__main__':
    print("=== MariaDB 연결 및 데이터 처리 시작 ===")

    show_data('finance')
    
    # 1. 연결 테스트
    if test_connection():
        print("\n1. 연결 테스트 통과!")
        
        # 2. 테이블 목록 조회
        print("\n2. 기존 테이블 목록:")
        show_tables()
        
    #     # 3. 샘플 테이블 생성 (필요시)
    #     # print("\n3. 샘플 테이블 생성:")
    #     # create_sql = create_sample_table()
    #     # load_csv_with_infile('dummy.csv', 'stock', create_sql)  # 더미 파일명
        
        # 4. CSV 파일 로드 (실제 사용 및 업데이트 될 때 마다 업로드 해줘야함)
        # csv_file = 'C:\Users\EZEN\Desktop\pythonGifree\fastapi\lifestyle_data.csv'
        # table_name = 'stock'
        # create_sql = create_sample_table()
        # load_csv_with_infile(csv_file, table_name, create_sql)
        
        # 5. 데이터 조회 (실제 사용시)
        print("\n5. 데이터 조회:")
        df = show_data('tbl_product')
        if df is not None and not df.empty:
             print("조회 결과:")
             print(df.head())
             print(f"\n총 {len(df)}개 행이 조회되었습니다.")

             
        
    else:
        print("❌ 데이터베이스 연결에 실패했습니다.")
        print("다음 사항들을 확인해주세요:")
        print("1. MariaDB가 실행 중인지 확인")
        print("2. 사용자명과 비밀번호가 올바른지 확인") 
        print("3. 데이터베이스 'webdb'가 존재하는지 확인")
        

