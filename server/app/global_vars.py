#
SPARK_HOME = '/opt/spark'

SERVER_HOME = '/var/www/html/kibitz/server'

TMP_FILES = '/var/www/html/kibitz/server/tmp_files'

SOLR_SETTINGS = {'port': 8983 }

KIBITZ_TABLE_MARKER = '_32271kibitztable'

# api urls
user_api = ''

# NOTE: doesn't include the primary key 'id'
recsys_param_format = ['name', 'url_name', 'repo_base', 'repo_name', 'item_table_name', 'primary_key', \
            'title_field', 'description_field', 'image_link_field', 'universal_code_field', 'template', 'status', 'owner_id']

required_recsys_params = ['title', 'description', 'image']

default_recsys_template = {"rating_icon_color": "#000000", "rating_icon_font_size": 14, "rating_states":[{'stateOn': 'fa fa-star', 'stateOff': 'fa fa-star-o'},\
                        {'stateOn': 'fa fa-star', 'stateOff': 'fa fa-star-o'}, \
                        {'stateOn': 'fa fa-star', 'stateOff': 'fa fa-star-o'}, \
                        {'stateOn': 'fa fa-star', 'stateOff': 'fa fa-star-o'}, \
                        {'stateOn': 'fa fa-star', 'stateOff': 'fa fa-star-o'}], \
            "use_field_selection":"false", "field_selection_column_name":"", \
            "template_number":1, "item_width":'280px', "item_fields_include":[], "item_fields_order":[], "filter_fields":[]}




# userTableFormat = '[{"column_name":"id", "data_type":"text" }, {"column_name":"username", "data_type":"text" }, {"column_name":"email", "data_type":"text" } ,{"column_name":"password", "data_type":"text" } ]'
# ratingTableFormat = '[{"column_name":"id", "data_type":"text" }, {"column_name":"user_id", "data_type":"text" }, {"column_name":"item_id", "data_type":"text" } ,{"column_name":"rating", "data_type":"text" } ,{"column_name":"timestamp", "data_type":"text" } ]'
