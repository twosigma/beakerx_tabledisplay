/*
 *  Copyright 2017 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as widgets from '@jupyter-widgets/base';
import { BEAKERX_MODULE_VERSION } from './version';

export class TableDisplayModel extends widgets.DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: 'TableDisplayModel',
      _view_name: 'TableDisplayView',
      _model_module: 'beakerx_tabledisplay',
      _view_module: 'beakerx_tabledisplay',
      _model_module_version: BEAKERX_MODULE_VERSION,
      _view_module_version: BEAKERX_MODULE_VERSION,
    };
  }
}
