
import pandas as pd
import io

df_data = '''user_id,count

4,4

2,5

1,3

'''
df = pd.read_csv(io.StringIO(df_data))

# 아래는 AI가 생성한 그래프 코드
# -*- coding: utf-8 -*-
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import pandas as pd
import io

fe = fm.FontEntry(fname=r'./NanumGothic.ttf', name='NanumGothic')
fm.fontManager.ttflist.insert(0, fe)
plt.rcParams.update({'font.size': 12, 'font.family': 'NanumGothic'})

plt.bar(df['user_id'], df['count'], color=['silver', 'gold', '#CD7F32'])
plt.title("상위 3명 기부 현황")
plt.xlabel("사용자 ID")
plt.ylabel("기부 횟수")

for index, value in enumerate(df['count']):
    plt.text(index + 1, value, str(value), ha='center', va='bottom')

plt.savefig('./result.png')
