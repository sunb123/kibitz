import sys, csv

def is_isbn(num):
    num = num.replace('-','')
    nums = list(str(num))
    if len(nums) == 10 and nums[0] == '0':
        total = 0
        for i in xrange(len(nums)-1, -1, -1):
            total += int(nums[len(nums) - i - 1]) * (i+1)
        if total % 11 == 0:
            return True
        else:
            return False
    elif len(nums) == 13 and num[0:3] == '978':
        total = 0
        for i in xrange(len(nums)):
            if (i+1) % 2 == 0:
                total += int(nums[i]) * 3
            else:
                total += int(nums[i])
        if total % 10 == 0:
            return True
        else:
            return False

def convert_isbn13to10(num): # assumes valid isbn13
    num = num.replace('-','') # remove hyphens
    num = num[3:] # remove prefix 978
    nums = list(str(num))
    nums[-1] = '0' # remove last digit, the checksum

    total = 0
    for i in xrange(len(nums)-1, -1, -1):
        total += int(nums[len(nums) - i - 1]) * (i+1)
    total %= 11
    checksum = 11 - total
    checksum = str(checksum)
    nums[-1] = checksum
    return ''.join(nums)

amazon_link_format = "http://images.amazon.com/images/P/{}.01.20TRZZZZ.jpg"

if __name__ == '__main__':
    file_name = sys.argv[1]
    col_num_isbn = int(sys.argv[2]) - 1
    with open(file_name,'r') as f, \
    open('data_out.csv','w') as g:
        reader = csv.reader(f)
        writer = csv.writer(g)
        headers = reader.next()
        headers.append('image_link_custom')
        writer.writerow(headers)
        for row in reader:
            field = row[col_num_isbn]
            if is_isbn(field): # append image link
                if len(field) == 13:
                    field = convert_isbn13to10(field)
                image_link = amazon_link_format.format(field)
                row.append(image_link)
            writer.writerow(row)
