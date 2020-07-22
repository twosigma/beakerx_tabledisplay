# Copyright 2020 TWO SIGMA OPEN SOURCE, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from beakerx_tabledisplay import TableDisplay
from IPython.display import display_html
import pandas

class TableDisplayWrapper(object):
    def __get__(self, model_instance, model_class):
        def f():
            display_html(TableDisplay(model_instance))

        return f



class BeakerXTabledisplay:

    def __init__(self):
        BeakerXTabledisplay.pandas_display_table()

    @staticmethod
    def pandas_display_default():
        pandas.DataFrame._ipython_display_ = None

    @staticmethod
    def pandas_display_table():
        pandas.DataFrame._ipython_display_ = TableDisplayWrapper()
