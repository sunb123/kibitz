#!/bin/bash

CORE_NAME=''
CSV_FILE_PATH=''

while getopts c:f: FLAG; do
    case $FLAG in
        c)
            case $OPTARG in
                *)
		    CORE_NAME=$OPTARG
                ;;
            esac
        ;;
        f)
            case $OPTARG in
                *)
		    CSV_FILE_PATH=$OPTARG
                ;;
            esac
        ;;        
        *)
            echo "error: unknown option $FLAG"
            exit 1
        ;;
    esac
done

sudo curl http://localhost:8983/solr/${CORE_NAME}/update?commit=true -d '<delete><query>*:*</query></delete>'

sudo -u ubuntu /var/www/html/kibitz/server/solr-6.5.0/bin/post -c $CORE_NAME $CSV_FILE_PATH  #index a csv file
