import pymysql
import sys

def connectdb():
	print('connect to mysql服务器...')
	try:
		db = pymysql.connect("localhost","root","","root")
	except:
		print("Error: can't connect to mysql database")
		exit(0)
	print('connected !')
	return db
def querydb(db):
	writePath = sys.argv[1]
	file = open(writePath, "w")
    # 使用cursor()方法获取操作游标 
	cursor = db.cursor()
	sql = "SELECT * FROM students"
	#try:
		# 执行SQL语句
	cursor.execute(sql)
	# 获取所有记录列表
	results = cursor.fetchall()
	file.write("%d %d\n" % (len(results), len(results[0])))
	for row in results:
		id = row[0]
		grade = row[6]
		birth = row[5]
		name = row[4]
		# 打印结果
		file.write("%d %d %d\n" % (row[1], row[2], row[3]))
		# print("id: %d, name: %s, grade: %f, birth: %s" % \
		# 	(id, name, grade, birth))
	# except:	
	# 	print("Error: unable to fecth data")

def main():
	db = connectdb()
	querydb(db) 
if __name__ == '__main__':
    main()