with open('test.txt', 'r') as f:
	data = f.readlines()

print(data)
data[1] = 'pie'

with open('test.txt', 'w') as f:
	f.writelines(data)
