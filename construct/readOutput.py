import csv


# testList = ["mnist_vec784D", "fashion_mnist", "cifar10", "cifar100","svhn"]
List = []
for i in range(4):
	List.append([])


def readTxt(path):
	file = open(path)
	# tmpNumber = []
	for line in file:
		pos = line.find('falseRatio: ')
		if(pos != -1):
			pos += len('falseRatio: ')
			newString = line[pos:]
			sPos = newString.find(' ')
			number = float(newString[:sPos])
			List[0].append(number)

		pos = line.find('largeFalseRatio: ')
		if(pos != -1):
			pos += len('largeFalseRatio: ')
			newString = line[pos:]
			sPos = newString.find(' ')
			number = float(newString[:sPos])
			List[1].append(number)

		pos = line.find('falseOffset: ')	
		if(pos != -1):
			pos += len('falseOffset: ')
			newString = line[pos:]
			sPos = newString.find(' ')
			number = float(newString[:sPos])
			List[2].append(number)

		pos = line.find('lessNum: ')
		if(pos != -1):
			pos += len('lessNum: ')
			newString = line[pos:]
			sPos = newString.find(' ')
			number = float(newString[:sPos])
			List[3].append(number)

readTxt('./outPut.txt')
out = open('./tmp.csv', 'w', newline='')
csv_write = csv.writer(out, dialect='excel')
for z in List:
	csv_write.writerow(z)